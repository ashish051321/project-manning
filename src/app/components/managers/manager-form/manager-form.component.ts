import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeamDataService } from '../../../services/team-data.service';
import { TeamManagementService } from '../../../services/team-management.service';
import { Manager, Team, ManagerFormData } from '../../../models/team-models';

@Component({
  selector: 'app-manager-form',
  templateUrl: './manager-form.component.html',
  styleUrls: ['./manager-form.component.scss']
})
export class ManagerFormComponent implements OnInit, OnDestroy {
  managerForm: FormGroup;
  teams: Team[] = [];
  availableTeams: Team[] = [];
  loading = true;
  isEditMode = false;
  managerId: string | null = null;
  private dataSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private teamDataService: TeamDataService,
    private teamManagementService: TeamManagementService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.managerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      role: ['', [Validators.required, Validators.minLength(2)]],
      teams: [[]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFormListeners();
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
        this.availableTeams = this.teams.filter(team => !team.managerId || team.managerId === '');
        
        // Check if we're in edit mode
        this.managerId = this.route.snapshot.paramMap.get('id');
        if (this.managerId) {
          this.isEditMode = true;
          this.loadManagerForEdit(this.managerId);
        }
      }
      this.loading = false;
    });
  }

  private loadManagerForEdit(managerId: string): void {
    const manager = this.teamDataService.getManagerById(managerId);
    if (manager) {
      this.managerForm.patchValue({
        name: manager.name,
        role: manager.role,
        teams: manager.teams,
        description: manager.description
      });
      
      // Update available teams to include teams currently assigned to this manager
      const assignedTeams = this.teams.filter(team => team.managerId === managerId);
      this.availableTeams = [
        ...this.teams.filter(team => !team.managerId || team.managerId === ''),
        ...assignedTeams
      ];
    }
  }

  private setupFormListeners(): void {
    // You could add form change listeners here if needed
  }

  onSubmit(): void {
    if (this.managerForm.valid) {
      const formData: ManagerFormData = this.managerForm.value;
      
      if (this.isEditMode && this.managerId) {
        this.teamManagementService.updateManager(this.managerId, formData);
      } else {
        this.teamManagementService.addManager(formData);
      }
      
      this.router.navigate(['/managers']);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/managers']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.managerForm.controls).forEach(key => {
      const control = this.managerForm.get(key);
      control?.markAsTouched();
    });
  }

  getTeamName(teamId: string): string {
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  }

  getAvailableTeams(): Team[] {
    const selectedTeams = this.managerForm.get('teams')?.value || [];
    return this.availableTeams.filter(team => !selectedTeams.includes(team.id));
  }

  addTeam(teamId: string): void {
    const currentTeams = this.managerForm.get('teams')?.value || [];
    if (!currentTeams.includes(teamId)) {
      this.managerForm.patchValue({
        teams: [...currentTeams, teamId]
      });
    }
  }

  removeTeam(teamId: string): void {
    const currentTeams = this.managerForm.get('teams')?.value || [];
    this.managerForm.patchValue({
      teams: currentTeams.filter((id: string) => id !== teamId)
    });
  }

  getSelectedTeams(): Team[] {
    const teamIds = this.managerForm.get('teams')?.value || [];
    return this.teams.filter(team => teamIds.includes(team.id));
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.managerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.managerForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  getTeamCount(): number {
    const selectedTeams = this.managerForm.get('teams')?.value || [];
    return selectedTeams.length;
  }

  getAvailableTeamCount(): number {
    return this.getAvailableTeams().length;
  }
}
