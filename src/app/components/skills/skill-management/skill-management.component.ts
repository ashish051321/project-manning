import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TeamDataService } from '../../../services/team-data.service';
import { TeamManagementService } from '../../../services/team-management.service';
import { SkillDefinitions, SkillDefinition } from '../../../models/team-models';

@Component({
  selector: 'app-skill-management',
  templateUrl: './skill-management.component.html',
  styleUrls: ['./skill-management.component.scss']
})
export class SkillManagementComponent implements OnInit, OnDestroy {
  // Form for adding/editing skills
  skillForm!: FormGroup;
  
  // Data
  skillDefinitions: SkillDefinitions = { techSkills: {}, appSkills: {} };
  loading = true;
  isEditMode = false;
  editingSkillType: 'tech' | 'app' = 'tech';
  editingSkillName: string = '';
  
  // UI state
  activeTab: 'tech' | 'app' = 'tech';
  showAddForm = false;
  
  private dataSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private teamDataService: TeamDataService,
    private teamManagementService: TeamManagementService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.skillForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      scale: ['1-10', Validators.required]
    });
  }

  private loadData(): void {
    this.dataSubscription = this.teamDataService.getTeamData().subscribe(data => {
      if (data) {
        this.skillDefinitions = data.skillDefinitions;
      }
      this.loading = false;
    });
  }

  // Tab management
  setActiveTab(tab: 'tech' | 'app'): void {
    this.activeTab = tab;
    this.resetForm();
  }

  // Form management
  showAddSkillForm(): void {
    this.isEditMode = false;
    this.editingSkillName = '';
    this.editingSkillType = this.activeTab;
    this.showAddForm = true;
    this.resetForm();
  }

  editSkill(skillName: string, type: 'tech' | 'app'): void {
    this.isEditMode = true;
    this.editingSkillName = skillName;
    this.editingSkillType = type;
    this.activeTab = type;
    this.showAddForm = true;
    
    const skill = type === 'tech' 
      ? this.skillDefinitions.techSkills[skillName]
      : this.skillDefinitions.appSkills[skillName];
    
    if (skill) {
      this.skillForm.patchValue({
        name: skillName,
        description: skill.description,
        category: skill.category,
        scale: skill.scale
      });
    }
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.skillForm.reset({
      name: '',
      description: '',
      category: '',
      scale: '1-10'
    });
    this.skillForm.markAsUntouched();
  }

  onSubmit(): void {
    if (this.skillForm.valid) {
      const formData = this.skillForm.value;
      
      if (this.isEditMode) {
        // Update existing skill
        this.updateSkill(formData);
      } else {
        // Add new skill
        this.addSkill(formData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private addSkill(formData: any): void {
    const skillData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      scale: formData.scale
    };

    if (this.activeTab === 'tech') {
      this.teamManagementService.addTechSkill(skillData);
    } else {
      this.teamManagementService.addAppSkill(skillData);
    }

    this.showAddForm = false;
    this.resetForm();
  }

  private updateSkill(formData: any): void {
    const skillData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      scale: formData.scale
    };

    // For updates, pass the old skill name to handle skill name changes
    if (this.editingSkillType === 'tech') {
      this.teamManagementService.addTechSkill(skillData, this.editingSkillName);
    } else {
      this.teamManagementService.addAppSkill(skillData, this.editingSkillName);
    }

    this.showAddForm = false;
    this.resetForm();
  }

  deleteSkill(skillName: string, type: 'tech' | 'app'): void {
    const skillType = type === 'tech' ? 'Technical Skill' : 'Application Skill';
    if (confirm(`Are you sure you want to delete the ${skillType} "${skillName}"? This will also remove it from all developers who have this skill.`)) {
      if (type === 'tech') {
        this.teamManagementService.deleteTechSkill(skillName);
      } else {
        this.teamManagementService.deleteAppSkill(skillName);
      }
    }
  }

  // Helper methods
  getTechSkills(): Array<{name: string, skill: SkillDefinition}> {
    return Object.entries(this.skillDefinitions.techSkills).map(([name, skill]) => ({ name, skill }));
  }

  getAppSkills(): Array<{name: string, skill: SkillDefinition}> {
    return Object.entries(this.skillDefinitions.appSkills).map(([name, skill]) => ({ name, skill }));
  }

  getSkillCount(type: 'tech' | 'app'): number {
    return type === 'tech' 
      ? Object.keys(this.skillDefinitions.techSkills).length
      : Object.keys(this.skillDefinitions.appSkills).length;
  }

  getTotalSkillCount(): number {
    return this.getSkillCount('tech') + this.getSkillCount('app');
  }

  getSkillUsageCount(skillName: string, type: 'tech' | 'app'): number {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return 0;

    return currentData.developers.filter(developer => {
      if (type === 'tech') {
        return developer.techSkills[skillName] !== undefined;
      } else {
        return developer.appSkills[skillName] !== undefined;
      }
    }).length;
  }

  // Form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.skillForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.skillForm.get(fieldName);
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

  private markFormGroupTouched(): void {
    Object.keys(this.skillForm.controls).forEach(key => {
      const control = this.skillForm.get(key);
      control?.markAsTouched();
    });
  }
}
