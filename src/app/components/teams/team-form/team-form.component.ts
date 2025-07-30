import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeamDataService } from '../../../services/team-data.service';
import { TeamManagementService } from '../../../services/team-management.service';
import { Team, Manager, Developer, TeamFormData } from '../../../models/team-models';

@Component({
  selector: 'app-team-form',
  templateUrl: './team-form.component.html',
  styleUrls: ['./team-form.component.scss']
})
export class TeamFormComponent implements OnInit, OnDestroy {
  teamForm: FormGroup;
  managers: Manager[] = [];
  developers: Developer[] = [];
  availableDevelopers: Developer[] = [];
  availableSharedResources: Developer[] = [];
  loading = true;
  isEditMode = false;
  teamId: string | null = null;
  private dataSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private teamDataService: TeamDataService,
    private teamManagementService: TeamManagementService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      managerId: [''],
      developers: [[]],
      sharedResources: [[]],
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
        this.managers = data.managers;
        this.developers = data.developers;
        this.availableDevelopers = this.developers.filter(d => !d.isSharedResource && !d.teamId);
        this.availableSharedResources = this.developers.filter(d => d.isSharedResource);
        
        // Check if we're in edit mode
        this.teamId = this.route.snapshot.paramMap.get('id');
        if (this.teamId) {
          this.isEditMode = true;
          this.loadTeamForEdit(this.teamId);
        }
      }
      this.loading = false;
    });
  }

  private loadTeamForEdit(teamId: string): void {
    const team = this.teamDataService.getTeamById(teamId);
    if (team) {
      this.teamForm.patchValue({
        name: team.name,
        managerId: team.managerId,
        developers: team.developers,
        sharedResources: team.sharedResources,
        description: team.description
      });
      
      // Update available developers to include current team members
      this.availableDevelopers = this.developers.filter(d => 
        !d.isSharedResource && (!d.teamId || d.teamId === teamId)
      );
    }
  }

  private setupFormListeners(): void {
    // Update available developers when manager changes
    this.teamForm.get('managerId')?.valueChanges.subscribe(managerId => {
      // You could add logic here to filter developers based on manager if needed
    });
  }

  onSubmit(): void {
    if (this.teamForm.valid) {
      const formData: TeamFormData = this.teamForm.value;
      
      if (this.isEditMode && this.teamId) {
        this.teamManagementService.updateTeam(this.teamId, formData);
      } else {
        this.teamManagementService.addTeam(formData);
      }
      
      this.router.navigate(['/teams']);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/teams']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.teamForm.controls).forEach(key => {
      const control = this.teamForm.get(key);
      control?.markAsTouched();
    });
  }

  getManagerName(managerId: string): string {
    const manager = this.managers.find(m => m.id === managerId);
    return manager ? manager.name : 'Unknown Manager';
  }

  getDeveloperName(developerId: string): string {
    const developer = this.developers.find(d => d.id === developerId);
    return developer ? developer.name : 'Unknown Developer';
  }

  getAvailableDevelopers(): Developer[] {
    const selectedDevelopers = this.teamForm.get('developers')?.value || [];
    return this.developers.filter(d => 
      !d.isSharedResource && 
      (!d.teamId || d.teamId === this.teamId) &&
      !selectedDevelopers.includes(d.id)
    );
  }

  getAvailableSharedResources(): Developer[] {
    const selectedSharedResources = this.teamForm.get('sharedResources')?.value || [];
    return this.developers.filter(d => 
      d.isSharedResource && 
      !selectedSharedResources.includes(d.id)
    );
  }

  addDeveloper(developerId: string): void {
    const currentDevelopers = this.teamForm.get('developers')?.value || [];
    if (!currentDevelopers.includes(developerId)) {
      this.teamForm.patchValue({
        developers: [...currentDevelopers, developerId]
      });
    }
  }

  removeDeveloper(developerId: string): void {
    const currentDevelopers = this.teamForm.get('developers')?.value || [];
    this.teamForm.patchValue({
      developers: currentDevelopers.filter((id: string) => id !== developerId)
    });
  }

  addSharedResource(developerId: string): void {
    const currentSharedResources = this.teamForm.get('sharedResources')?.value || [];
    if (!currentSharedResources.includes(developerId)) {
      this.teamForm.patchValue({
        sharedResources: [...currentSharedResources, developerId]
      });
    }
  }

  removeSharedResource(developerId: string): void {
    const currentSharedResources = this.teamForm.get('sharedResources')?.value || [];
    this.teamForm.patchValue({
      sharedResources: currentSharedResources.filter((id: string) => id !== developerId)
    });
  }

  getSelectedDevelopers(): Developer[] {
    const developerIds = this.teamForm.get('developers')?.value || [];
    return this.developers.filter(d => developerIds.includes(d.id));
  }

  getSelectedSharedResources(): Developer[] {
    const sharedResourceIds = this.teamForm.get('sharedResources')?.value || [];
    return this.developers.filter(d => sharedResourceIds.includes(d.id));
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.teamForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.teamForm.get(fieldName);
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

  // Helper method to access Object.keys in template
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
