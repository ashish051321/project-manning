import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  teamMembers: string[] = [];

  addTeamMember(memberInfo: any) {
    const memberInfoString = `${memberInfo.name} - Skills: ${memberInfo.skills.join(", ")} - Vacation: ${memberInfo.vacation.start.toLocaleDateString()} to ${memberInfo.vacation.end.toLocaleDateString()}`;
    this.teamMembers.push(memberInfoString);
  }
}
