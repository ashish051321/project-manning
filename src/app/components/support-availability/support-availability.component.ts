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
  
  // Calendar
  calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isAtRisk: boolean;
    unavailableDevelopers: Developer[];
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
      const { isAtRisk, unavailableDevelopers } = this.checkAvailabilityForDate(date);
      
      this.calendarDays.push({
        date,
        isCurrentMonth,
        isToday,
        isAtRisk,
        unavailableDevelopers
      });
      
      current.setDate(current.getDate() + 1);
    }
  }

  private checkAvailabilityForDate(date: Date): { isAtRisk: boolean, unavailableDevelopers: Developer[] } {
    const teamDevelopers = this.getTeamDevelopers();
    const unavailableDevelopers: Developer[] = [];
    
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
    
    return { isAtRisk, unavailableDevelopers };
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
      // Show developers modal or navigate to first developer
      this.navigateToDeveloper(day.unavailableDevelopers[0].id);
    }
  }

  navigateToDeveloper(developerId: string): void {
    this.router.navigate(['/developers/edit', developerId]);
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
    return app || 'Select Application';
  }

  getUnavailableDevelopersText(developers: Developer[]): string {
    if (developers.length === 0) return '';
    if (developers.length === 1) return developers[0].name;
    return `${developers.length} developers unavailable`;
  }

  hasAnyRiskDays(): boolean {
    return this.calendarDays.some(day => day.isAtRisk);
  }
} 