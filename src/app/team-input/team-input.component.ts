import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-team-input',
  templateUrl: './team-input.component.html',
  styleUrls: ['./team-input.component.scss']
})
export class TeamInputComponent {
  memberName: string = '';
  selectedSkills: string[] = [];
  startDate: string = '';
  endDate: string = '';

  @Output() addMember = new EventEmitter<any>();

  skills: string[] = ["Frontend", "Backend", "Devops"]; // Add more skills as needed

  addTeamMember() {
    const memberInfo = {
      name: this.memberName,
      skills: this.selectedSkills,
      vacation: { start: new Date(this.startDate), end: new Date(this.endDate) }
    };
    this.addMember.emit(memberInfo);
    this.resetForm();
  }

  resetForm() {
    this.memberName = '';
    this.selectedSkills = [];
    this.startDate = '';
    this.endDate = '';
  }
}
