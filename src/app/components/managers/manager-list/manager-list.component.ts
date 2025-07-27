import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeamDataService } from '../../../services/team-data.service';
import { TeamManagementService } from '../../../services/team-management.service';
import { Manager, Team } from '../../../models/team-models';

@Component({
  selector: 'app-manager-list',
  templateUrl: './manager-list.component.html',
  styleUrls: ['./manager-list.component.scss']
})
export class ManagerListComponent implements OnInit, OnDestroy {
  managers: Manager[] = [];
  teams: Team[] = [];
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
        this.managers = data.managers;
        this.teams = data.teams;
      }
      this.loading = false;
    });
  }

  addManager(): void {
    this.router.navigate(['/managers/add']);
  }

  editManager(managerId: string): void {
    this.router.navigate(['/managers/edit', managerId]);
  }

  deleteManager(managerId: string): void {
    if (confirm('Are you sure you want to delete this manager? This action cannot be undone.')) {
      this.teamManagementService.deleteManager(managerId);
      // Data will be automatically updated through the subscription
    }
  }

  getTeamsForManager(managerId: string): Team[] {
    return this.teams.filter(team => team.managerId === managerId);
  }

  getTeamNames(teamIds: string[]): string {
    const teamNames = teamIds.map(id => {
      const team = this.teams.find(t => t.id === id);
      return team ? team.name : 'Unknown Team';
    });
    return teamNames.join(', ') || 'No teams assigned';
  }

  refreshData(): void {
    this.loadData();
  }

  getManagerCount(): number {
    return this.managers.length;
  }

  getActiveTeamsCount(): number {
    return this.teams.filter(team => team.managerId && team.managerId !== '').length;
  }
}
