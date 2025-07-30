import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeamDataService } from '../../../services/team-data.service';
import { TeamManagementService } from '../../../services/team-management.service';
import { Developer, Team, Manager } from '../../../models/team-models';

@Component({
  selector: 'app-developer-list',
  templateUrl: './developer-list.component.html',
  styleUrls: ['./developer-list.component.scss']
})
export class DeveloperListComponent implements OnInit, OnDestroy {
  developers: Developer[] = [];
  teams: Team[] = [];
  managers: Manager[] = [];
  loading = true;
  private dataSubscription: Subscription | null = null;

  constructor(
    private teamDataService: TeamDataService,
    private teamManagementService: TeamManagementService,
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
    this.loading = true;
    this.dataSubscription = this.teamDataService.getTeamData().subscribe(data => {
      if (data) {
        this.developers = data.developers;
        this.teams = data.teams;
        this.managers = data.managers;
      }
      this.loading = false;
    });
  }

  addDeveloper(): void {
    this.router.navigate(['/developers/add']);
  }

  editDeveloper(developerId: string): void {
    this.router.navigate(['/developers/edit', developerId]);
  }

  deleteDeveloper(developerId: string): void {
    if (confirm('Are you sure you want to delete this developer? This will remove all team assignments and skills.')) {
      this.teamManagementService.deleteDeveloper(developerId);
      // Data will be automatically updated through the subscription
    }
  }

  getTeamName(teamId: string | null): string {
    if (!teamId) return 'No Team Assigned';
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  }

  getManagerName(teamId: string | null): string {
    if (!teamId) return 'No Manager';
    const team = this.teams.find(t => t.id === teamId);
    if (!team || !team.managerId) return 'No Manager';
    const manager = this.managers.find(m => m.id === team.managerId);
    return manager ? manager.name : 'Unknown Manager';
  }

  getAssignedTeamNames(developer: Developer): string {
    if (developer.isSharedResource && developer.assignedTeams) {
      const teamNames = developer.assignedTeams.map(teamId => {
        const team = this.teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
      });
      return teamNames.join(', ') || 'No teams assigned';
    }
    return this.getTeamName(developer.teamId);
  }

  getPrimaryTeam(developer: Developer): Team | null {
    if (developer.teamId) {
      return this.teams.find(t => t.id === developer.teamId) || null;
    }
    return null;
  }

  getSharedTeams(developer: Developer): Team[] {
    if (developer.isSharedResource && developer.assignedTeams) {
      return this.teams.filter(team => developer.assignedTeams!.includes(team.id));
    }
    return [];
  }

  getTopSkills(developer: Developer, count: number = 3): string[] {
    const techSkills = Object.entries(developer.techSkills)
      .filter(([_, rating]) => rating && rating > 0)
      .sort(([_, a], [__, b]) => (b || 0) - (a || 0))
      .slice(0, count)
      .map(([skill, _]) => skill);
    
    return techSkills;
  }

  getSkillCount(developer: Developer): number {
    return Object.keys(developer.techSkills).filter(skill => 
      developer.techSkills[skill] && developer.techSkills[skill]! > 0
    ).length;
  }

  getAppCount(developer: Developer): number {
    return Object.keys(developer.appSkills).filter(app => 
      developer.appSkills[app] && developer.appSkills[app]! > 0
    ).length;
  }

  getVacationDays(developer: Developer): number {
    let totalDays = 0;
    
    for (const vacation of developer.availability.vacationDays) {
      if (vacation.type === 'single') {
        const date = new Date(vacation.date!);
        const dayOfWeek = date.getDay();
        // Only count if it's not Saturday (6) or Sunday (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          totalDays += 1;
        }
      } else if (vacation.type === 'range' && vacation.startDate && vacation.endDate) {
        const start = new Date(vacation.startDate);
        const end = new Date(vacation.endDate);
        
        // Set time to midnight to ensure accurate day comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // Iterate through each day in the range
        const current = new Date(start);
        
        while (current <= end) {
          const dayOfWeek = current.getDay();
          // Only count if it's not Saturday (6) or Sunday (0)
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            totalDays += 1;
          }
          current.setDate(current.getDate() + 1);
        }
      }
    }
    
    return totalDays;
  }

  getAvailabilityStatus(developer: Developer): string {
    return developer.availability.status === 'active' ? 'Active' : 'Inactive';
  }

  getAvailabilityClass(developer: Developer): string {
    return developer.availability.status === 'active' ? 'active' : 'inactive';
  }

  getDeveloperType(developer: Developer): string {
    if (developer.isSharedResource) {
      return 'Shared Resource';
    }
    return 'Primary Team Member';
  }

  getDeveloperTypeClass(developer: Developer): string {
    return developer.isSharedResource ? 'shared' : 'primary';
  }

  refreshData(): void {
    this.loadData();
  }

  getDeveloperCount(): number {
    return this.developers.length;
  }

  getPrimaryDevelopers(): number {
    return this.developers.filter(d => !d.isSharedResource).length;
  }

  getSharedResources(): number {
    return this.developers.filter(d => d.isSharedResource).length;
  }

  getActiveDevelopers(): number {
    return this.developers.filter(d => d.availability.status === 'active').length;
  }

  getDevelopersWithVacations(): number {
    return this.developers.filter(d => d.availability.vacationDays.length > 0).length;
  }

  getUnassignedDevelopers(): number {
    return this.developers.filter(d => !d.teamId && (!d.assignedTeams || d.assignedTeams.length === 0)).length;
  }
}
