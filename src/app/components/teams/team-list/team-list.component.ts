import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeamDataService } from '../../../services/team-data.service';
import { TeamManagementService } from '../../../services/team-management.service';
import { Team, Manager, Developer } from '../../../models/team-models';

@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.component.html',
  styleUrls: ['./team-list.component.scss']
})
export class TeamListComponent implements OnInit, OnDestroy {
  teams: Team[] = [];
  managers: Manager[] = [];
  developers: Developer[] = [];
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
        this.teams = data.teams;
        this.managers = data.managers;
        this.developers = data.developers;
      }
      this.loading = false;
    });
  }

  addTeam(): void {
    this.router.navigate(['/teams/add']);
  }

  editTeam(teamId: string): void {
    this.router.navigate(['/teams/edit', teamId]);
  }

  deleteTeam(teamId: string): void {
    if (confirm('Are you sure you want to delete this team? This will remove all team assignments.')) {
      this.teamManagementService.deleteTeam(teamId);
      // Data will be automatically updated through the subscription
    }
  }

  getManagerName(managerId: string): string {
    const manager = this.managers.find(m => m.id === managerId);
    return manager ? manager.name : 'No Manager Assigned';
  }

  getDevelopersForTeam(teamId: string): Developer[] {
    return this.developers.filter(developer => 
      developer.teamId === teamId || 
      (developer.isSharedResource && developer.assignedTeams?.includes(teamId))
    );
  }

  getDeveloperNames(developerIds: string[]): string {
    const developerNames = developerIds.map(id => {
      const developer = this.developers.find(d => d.id === id);
      return developer ? developer.name : 'Unknown Developer';
    });
    return developerNames.join(', ') || 'No developers assigned';
  }

  getTeamMemberCount(teamId: string): number {
    return this.getDevelopersForTeam(teamId).length;
  }

  getSharedResourceCount(teamId: string): number {
    return this.developers.filter(developer => 
      developer.isSharedResource && developer.assignedTeams?.includes(teamId)
    ).length;
  }

  getPrimaryDevelopers(teamId: string): Developer[] {
    return this.developers.filter(developer => developer.teamId === teamId);
  }

  getSharedResources(teamId: string): Developer[] {
    return this.developers.filter(developer => 
      developer.isSharedResource && developer.assignedTeams?.includes(teamId)
    );
  }

  refreshData(): void {
    this.loadData();
  }

  getTeamCount(): number {
    return this.teams.length;
  }

  getTeamsWithManagers(): number {
    return this.teams.filter(team => team.managerId && team.managerId !== '').length;
  }

  getTotalDevelopers(): number {
    return this.developers.length;
  }

  getSharedResourceIds(teamId: string): string[] {
    return this.getSharedResources(teamId).map(d => d.id);
  }
}
