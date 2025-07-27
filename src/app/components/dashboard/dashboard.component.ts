import { Component, OnInit } from '@angular/core';
import { TeamDataService } from '../../services/team-data.service';
import { TeamData } from '../../models/team-models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  teamData: TeamData | null = null;
  loading = true;
  showDataManagement = false;

  constructor(private teamDataService: TeamDataService) {}

  ngOnInit(): void {
    this.teamDataService.getTeamData().subscribe(data => {
      this.teamData = data;
      this.loading = false;
    });
  }

  get totalManagers(): number {
    return this.teamData?.managers.length || 0;
  }

  get totalTeams(): number {
    return this.teamData?.teams.length || 0;
  }

  get totalDevelopers(): number {
    return this.teamData?.developers.length || 0;
  }

  get sharedResources(): number {
    return this.teamData?.developers.filter(d => d.isSharedResource).length || 0;
  }

  get activeDevelopers(): number {
    return this.teamData?.developers.filter(d => d.availability.status === 'active').length || 0;
  }

  get totalVacations(): number {
    return this.teamData?.developers.reduce((total, dev) => 
      total + dev.availability.vacationDays.length, 0) || 0;
  }

  get lastUpdated(): string {
    return this.teamData?.organization.lastUpdated || 'Never';
  }

  get dataSize(): string {
    const sizeInBytes = this.teamDataService.getDataSize();
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  get hasStoredData(): boolean {
    return this.teamDataService.hasStoredData();
  }

  toggleDataManagement(): void {
    this.showDataManagement = !this.showDataManagement;
  }

  exportData(): void {
    const data = this.teamDataService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  importData(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const jsonData = e.target.result;
        const success = this.teamDataService.importData(jsonData);
        if (success) {
          alert('Data imported successfully!');
        } else {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }

  resetToInitialData(): void {
    if (confirm('This will reset all data to the initial state. Are you sure?')) {
      this.teamDataService.resetToInitialData();
      alert('Data reset to initial state!');
    }
  }

  clearAllData(): void {
    if (confirm('This will clear all data permanently. Are you sure?')) {
      this.teamDataService.clearAllData();
      alert('All data cleared!');
    }
  }
}
