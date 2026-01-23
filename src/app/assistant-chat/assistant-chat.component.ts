import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { SettingsService } from '../settings.service';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

@Component({
  selector: 'app-assistant-chat',
  templateUrl: './assistant-chat.component.html',
  styleUrls: ['./assistant-chat.component.scss'],
})
export class AssistantChatComponent {
  chatOpen = false;
  formData = { name: '', email: '', message: '' };
  isKeyboardOpen = false;

  keyboardHeight = 0;

  constructor(private http: HttpClient, private platform: Platform, private settingsService: SettingsService) {}

  async ngOnInit() {
    await Keyboard.setResizeMode({ mode: KeyboardResize.None });

    Keyboard.addListener('keyboardWillShow', (e) => {
      this.keyboardHeight = e.keyboardHeight;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      this.keyboardHeight = 0;
    });
  }

  get keyboardOffset(): number {
    if (!this.keyboardHeight) return 0;

    return Math.min(
      this.keyboardHeight * 0.6,
      window.innerHeight * 0.35
    );
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen;

    if (this.chatOpen) {
      setTimeout(() => {
        const panel = document.getElementById('chat-panel');
        if (panel) panel.focus();
      }, 120);
    }
  }


  async sendMessage() {
    try {
      await this.settingsService.sendMessage(
        this.formData.name,
        this.formData.email,
        this.formData.message
      );
      this.chatOpen = false;
      console.log('Message sent successfully!');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }
}
