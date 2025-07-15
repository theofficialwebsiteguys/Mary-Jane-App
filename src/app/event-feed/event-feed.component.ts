import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-event-feed',
  templateUrl: './event-feed.component.html',
  styleUrls: ['./event-feed.component.scss'],
})
export class EventFeedComponent implements OnInit {
  feed: any[] = [];

  ngOnInit() {
    this.feed = [
      {
        id: '1',
        type: 'rsvp',
        user: { name: 'John M.', avatar: 'https://i.pravatar.cc/100?img=12' },
        event: '4/20 Smoke Sesh',
        date: new Date('2025-06-08T10:00:00'),
      },
      {
        id: '2',
        type: 'comment',
        user: { name: 'Samantha B.', avatar: 'https://i.pravatar.cc/100?img=15' },
        content: 'Can’t wait for the GreenGold pop-up! Anyone been before?',
        date: new Date('2025-06-08T14:30:00'),
      },
      {
        id: '3',
        type: 'rsvp',
        user: { name: 'Derek F.', avatar: 'https://i.pravatar.cc/100?img=18' },
        event: 'Vendor Pop-Up: GreenGold',
        date: new Date('2025-06-08T16:00:00'),
      },
      {
        id: '4',
        type: 'comment',
        user: { name: 'Elena R.', avatar: 'https://i.pravatar.cc/100?img=22' },
        content: 'What time does the music start on Sunday?',
        date: new Date('2025-06-09T09:10:00'),
      },
    ];
  }
}
