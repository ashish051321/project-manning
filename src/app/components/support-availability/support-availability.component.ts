import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeamDataService } from '../../services/team-data.service';
import { Team, Developer, VacationDay } from '../../models/team-models';

@Component({
  selector: 'app-support-availability',
  templateUrl: './support-availability.component.html',
  styleUrls: ['./support-availability.component.scss']
})
export class SupportAvailabilityComponent implements OnInit, OnDestroy {
  // Data
  teams: Team[] = [];
  developers: Developer[] = [];
  applications: string[] = [];
  
  // UI State
  selectedTeamId: string = '';
  selectedApplication: string = '';
  currentDate: Date = new Date();
  currentMonth: Date = new Date();
  loading = true;
  
  // Popup Modal State
  showPopup = false;
  selectedDay: any = null;
  
  // Calendar
  calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isAtRisk: boolean;
    unavailableDevelopers: Developer[];
    affectedApps: string[];
  }> = [];
  
  private dataSubscription: Subscription | null = null;

  constructor(
    private teamDataService: TeamDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  private loadData(): void {
    this.dataSubscription = this.teamDataService.getTeamData().subscribe(data => {
      if (data) {
        this.teams = data.teams;
        this.developers = data.developers;
        this.applications = Object.keys(data.skillDefinitions.appSkills);
        
        // Auto-select first team and "All Apps" by default
        if (this.teams.length > 0 && !this.selectedTeamId) {
          this.selectedTeamId = this.teams[0].id;
          this.selectedApplication = 'all';
        }
        
        this.generateCalendar();
      }
      this.loading = false;
    });
  }

  // Team and Application Selection
  onTeamChange(): void {
    this.generateCalendar();
  }

  onApplicationChange(): void {
    this.generateCalendar();
  }

  // Calendar Navigation
  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentMonth = new Date();
    this.generateCalendar();
  }

  // Calendar Generation
  private generateCalendar(): void {
    if (!this.selectedTeamId || !this.selectedApplication) {
      this.calendarDays = [];
      return;
    }

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of calendar (including previous month's days)
    const firstDayOfWeek = firstDay.getDay();
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(calendarStart.getDate() - firstDayOfWeek);
    
    // Get last day of calendar (including next month's days)
    const lastDayOfWeek = lastDay.getDay();
    const calendarEnd = new Date(lastDay);
    calendarEnd.setDate(calendarEnd.getDate() + (6 - lastDayOfWeek));
    
    this.calendarDays = [];
    const current = new Date(calendarStart);
    
    while (current <= calendarEnd) {
      const date = new Date(current);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isSameDate(date, new Date());
      const { isAtRisk, unavailableDevelopers, affectedApps } = this.checkAvailabilityForDate(date);
      
      this.calendarDays.push({
        date,
        isCurrentMonth,
        isToday,
        isAtRisk,
        unavailableDevelopers,
        affectedApps
      });
      
      current.setDate(current.getDate() + 1);
    }
  }

  private checkAvailabilityForDate(date: Date): { 
    isAtRisk: boolean, 
    unavailableDevelopers: Developer[], 
    affectedApps: string[] 
  } {
    const teamDevelopers = this.getTeamDevelopers();
    const unavailableDevelopers: Developer[] = [];
    const affectedApps: string[] = [];
    
    if (this.selectedApplication === 'all') {
      // Check all applications owned by the team
      const teamApps = this.getTeamApplications();
      
      for (const app of teamApps) {
        const developersWithApp = teamDevelopers.filter(dev => 
          this.hasApplicationSkill(dev, app)
        );
        
        const unavailableForApp = developersWithApp.filter(dev => 
          this.isDeveloperOnVacation(dev, date)
        );
        
        // If all developers with this app are unavailable, the app is at risk
        if (developersWithApp.length > 0 && unavailableForApp.length === developersWithApp.length) {
          affectedApps.push(app);
          // Add developers to unavailable list (avoid duplicates)
          unavailableForApp.forEach(dev => {
            if (!unavailableDevelopers.find(d => d.id === dev.id)) {
              unavailableDevelopers.push(dev);
            }
          });
        }
      }
      
      const isAtRisk = affectedApps.length > 0;
      return { isAtRisk, unavailableDevelopers, affectedApps };
    } else {
      // Check specific application
      for (const developer of teamDevelopers) {
        if (this.hasApplicationSkill(developer, this.selectedApplication) && 
            this.isDeveloperOnVacation(developer, date)) {
          unavailableDevelopers.push(developer);
        }
      }
      
      // Check if all developers with this application skill are unavailable
      const developersWithApp = teamDevelopers.filter(dev => 
        this.hasApplicationSkill(dev, this.selectedApplication)
      );
      
      const isAtRisk = developersWithApp.length > 0 && 
                      unavailableDevelopers.length === developersWithApp.length;
      
      if (isAtRisk) {
        affectedApps.push(this.selectedApplication);
      }
      
      return { isAtRisk, unavailableDevelopers, affectedApps };
    }
  }

  private getTeamApplications(): string[] {
    const teamDevelopers = this.getTeamDevelopers();
    const teamApps = new Set<string>();
    
    teamDevelopers.forEach(developer => {
      Object.keys(developer.appSkills).forEach(app => {
        if (developer.appSkills[app] && developer.appSkills[app]! > 0) {
          teamApps.add(app);
        }
      });
    });
    
    return Array.from(teamApps);
  }

  private getTeamDevelopers(): Developer[] {
    if (!this.selectedTeamId) return [];
    
    const team = this.teams.find(t => t.id === this.selectedTeamId);
    if (!team) return [];
    
    // Get primary team members
    const primaryDevelopers = this.developers.filter(dev => dev.teamId === this.selectedTeamId);
    
    // Get shared resources assigned to this team
    const sharedDevelopers = this.developers.filter(dev => 
      dev.isSharedResource && 
      dev.assignedTeams?.includes(this.selectedTeamId)
    );
    
    return [...primaryDevelopers, ...sharedDevelopers];
  }

  private hasApplicationSkill(developer: Developer, application: string): boolean {
    return developer.appSkills[application] !== undefined && 
           developer.appSkills[application]! > 0;
  }

  private isDeveloperOnVacation(developer: Developer, date: Date): boolean {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    for (const vacation of developer.availability.vacationDays) {
      if (vacation.type === 'single') {
        const vacationDate = new Date(vacation.date!);
        vacationDate.setHours(0, 0, 0, 0);
        if (this.isSameDate(checkDate, vacationDate)) {
          return true;
        }
      } else if (vacation.type === 'range' && vacation.startDate && vacation.endDate) {
        const startDate = new Date(vacation.startDate);
        const endDate = new Date(vacation.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (checkDate >= startDate && checkDate <= endDate) {
          return true;
        }
      }
    }
    
    return false;
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // Date Selection
  onDateClick(day: any): void {
    if (day.isAtRisk && day.unavailableDevelopers.length > 0) {
      this.selectedDay = day;
      this.showPopup = true;
    }
  }

  closePopup(): void {
    this.showPopup = false;
    this.selectedDay = null;
  }

  getPopupTitle(): string {
    if (!this.selectedDay) return '';
    const date = this.selectedDay.date;
    return `Support Risk - ${date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
  }

  getAffectedAppsText(): string {
    if (!this.selectedDay || !this.selectedDay.affectedApps) return '';
    return this.selectedDay.affectedApps.join(', ');
  }

  getPopupUnavailableDevelopersText(): string {
    if (!this.selectedDay || !this.selectedDay.unavailableDevelopers) return '';
    return this.selectedDay.unavailableDevelopers.map((dev: Developer) => dev.name).join(', ');
  }

  getDeveloperDetails(developer: Developer): string {
    const teamName = this.getTeamName(developer.teamId || '');
    const resourceType = developer.isSharedResource ? 'Shared Resource' : 'Primary Member';
    return `${developer.name} (${teamName} - ${resourceType})`;
  }

  navigateToDeveloper(developerId: string): void {
    this.router.navigate(['/developers/edit', developerId]);
  }

  // New method to group risk data by application
  getRiskDataByApplication(): Array<{
    application: string;
    isAtRisk: boolean;
    unavailableDevelopers: Developer[];
    totalDevelopers: number;
  }> {
    if (!this.selectedDay) return [];

    const teamDevelopers = this.getTeamDevelopers();
    const riskData: Array<{
      application: string;
      isAtRisk: boolean;
      unavailableDevelopers: Developer[];
      totalDevelopers: number;
    }> = [];

    if (this.selectedApplication === 'all') {
      // Group by all affected applications
      for (const app of this.selectedDay.affectedApps) {
        const developersWithApp = teamDevelopers.filter(dev => 
          this.hasApplicationSkill(dev, app)
        );
        
        const unavailableForApp = developersWithApp.filter(dev => 
          this.isDeveloperOnVacation(dev, this.selectedDay.date)
        );

        riskData.push({
          application: app,
          isAtRisk: unavailableForApp.length === developersWithApp.length && developersWithApp.length > 0,
          unavailableDevelopers: unavailableForApp,
          totalDevelopers: developersWithApp.length
        });
      }
    } else {
      // Single application view
      const developersWithApp = teamDevelopers.filter(dev => 
        this.hasApplicationSkill(dev, this.selectedApplication)
      );
      
      const unavailableForApp = developersWithApp.filter(dev => 
        this.isDeveloperOnVacation(dev, this.selectedDay.date)
      );

      riskData.push({
        application: this.selectedApplication,
        isAtRisk: unavailableForApp.length === developersWithApp.length && developersWithApp.length > 0,
        unavailableDevelopers: unavailableForApp,
        totalDevelopers: developersWithApp.length
      });
    }

    return riskData;
  }

  // Helper methods
  getMonthName(): string {
    return this.currentMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  getDayName(dayIndex: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  }

  getTeamName(teamId: string): string {
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : 'Select Team';
  }

  getApplicationName(app: string): string {
    if (app === 'all') return 'All Apps';
    return app || 'Select Application';
  }

  getUnavailableDevelopersText(developers: Developer[]): string {
    if (developers.length === 0) return '';
    if (developers.length === 1) return developers[0].name;
    return `${developers.length} developers unavailable`;
  }

  getTooltipText(day: any): string {
    if (!day.isAtRisk) return '';
    
    let tooltip = '';
    
    if (day.affectedApps.length > 0) {
      tooltip += `Affected Apps: ${day.affectedApps.join(', ')}\n`;
    }
    
    if (day.unavailableDevelopers.length > 0) {
      const developerNames = day.unavailableDevelopers.map((dev: Developer) => dev.name);
      tooltip += `People on leave: ${developerNames.join(', ')}`;
    }
    
    return tooltip;
  }

  hasAnyRiskDays(): boolean {
    return this.calendarDays.some(day => day.isAtRisk);
  }

  // Table methods for team applications and developers
  getTeamApplicationsWithDevelopers(): Array<{
    application: string;
    developers: Developer[];
    totalDevelopers: number;
  }> {
    if (!this.selectedTeamId) return [];
    
    const teamDevelopers = this.getTeamDevelopers();
    const teamApps = this.getTeamApplications();
    
    return teamApps.map(app => {
      const developersWithApp = teamDevelopers.filter(dev => 
        this.hasApplicationSkill(dev, app)
      );
      
      return {
        application: app,
        developers: developersWithApp,
        totalDevelopers: developersWithApp.length
      };
    }).sort((a, b) => b.totalDevelopers - a.totalDevelopers); // Sort by number of developers (descending)
  }

  getDeveloperSkillLevel(developer: Developer, application: string): number {
    return developer.appSkills[application] || 0;
  }

  getSkillLevelClass(skillLevel: number): string {
    if (skillLevel >= 8) return 'expert';
    if (skillLevel >= 6) return 'advanced';
    if (skillLevel >= 4) return 'intermediate';
    return 'beginner';
  }

  getSkillLevelText(skillLevel: number): string {
    if (skillLevel >= 8) return 'Expert';
    if (skillLevel >= 6) return 'Advanced';
    if (skillLevel >= 4) return 'Intermediate';
    return 'Beginner';
  }

  getSkillDistribution(developers: Developer[], application: string, skillLevel: string): number {
    if (developers.length === 0) return 0;
    
    const developersWithSkill = developers.filter(dev => {
      const skillValue = this.getDeveloperSkillLevel(dev, application);
      const devSkillLevel = this.getSkillLevelClass(skillValue);
      return devSkillLevel === skillLevel;
    });
    
    return (developersWithSkill.length / developers.length) * 100;
  }

  getSkillDistributionTooltip(developers: Developer[], application: string, skillLevel: string): string {
    if (developers.length === 0) return '';
    
    const developersWithSkill = developers.filter(dev => {
      const skillValue = this.getDeveloperSkillLevel(dev, application);
      const devSkillLevel = this.getSkillLevelClass(skillValue);
      return devSkillLevel === skillLevel;
    });
    
    const percentage = (developersWithSkill.length / developers.length) * 100;
    const levelText = this.getSkillLevelText(this.getSkillLevelFromClass(skillLevel));
    
    if (developersWithSkill.length === 0) {
      return `${levelText}: 0% (0 developers)`;
    }
    
    const developerNames = developersWithSkill.map(dev => dev.name).join(', ');
    return `${levelText}: ${percentage.toFixed(1)}% (${developersWithSkill.length} developer${developersWithSkill.length > 1 ? 's' : ''}) - ${developerNames}`;
  }

  getSkillLevelFromClass(skillLevelClass: string): number {
    switch (skillLevelClass) {
      case 'expert': return 8;
      case 'advanced': return 6;
      case 'intermediate': return 4;
      case 'beginner': return 1;
      default: return 0;
    }
  }

  hasTeamApplications(): boolean {
    return this.getTeamApplicationsWithDevelopers().length > 0;
  }

  // Methods for unassigned team members
  getUnassignedTeamMembers(): Developer[] {
    if (!this.selectedTeamId) return [];
    
    const teamDevelopers = this.getTeamDevelopers();
    const teamApps = this.getTeamApplications();
    
    return teamDevelopers.filter(developer => {
      // Check if developer has any application skills
      const hasAnyAppSkills = Object.keys(developer.appSkills).some(app => 
        developer.appSkills[app] && developer.appSkills[app]! > 0
      );
      
      // Check if any of their app skills are relevant to team applications
      const hasTeamAppSkills = teamApps.some(app => 
        developer.appSkills[app] && developer.appSkills[app]! > 0
      );
      
      // Return true if developer has no app skills at all, or no skills relevant to team apps
      return !hasAnyAppSkills || !hasTeamAppSkills;
    });
  }

  hasUnassignedTeamMembers(): boolean {
    return this.getUnassignedTeamMembers().length > 0;
  }

  getDeveloperTechSkills(developer: Developer): string[] {
    return Object.keys(developer.techSkills).filter(skill => 
      developer.techSkills[skill] && developer.techSkills[skill]! > 0
    );
  }

  getDeveloperAppSkills(developer: Developer): string[] {
    return Object.keys(developer.appSkills).filter(app => 
      developer.appSkills[app] && developer.appSkills[app]! > 0
    );
  }

  getHighestTechSkillLevel(developer: Developer): number {
    const techSkillValues = Object.values(developer.techSkills).filter(value => value && value > 0) as number[];
    return techSkillValues.length > 0 ? Math.max(...techSkillValues) : 0;
  }

  getHighestAppSkillLevel(developer: Developer): number {
    const appSkillValues = Object.values(developer.appSkills).filter(value => value && value > 0) as number[];
    return appSkillValues.length > 0 ? Math.max(...appSkillValues) : 0;
  }
} 