import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, RouterModule } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SplashScreenComponent } from './splash-screen/splash-screen.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { RestrictedComponent } from './restricted/restricted.component';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { AssistantChatComponent } from './assistant-chat/assistant-chat.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [AppComponent, SplashScreenComponent, RestrictedComponent, AssistantChatComponent],
  imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule, FormsModule, 
    IonicModule.forRoot({
      scrollAssist: true,
      scrollPadding: true
    }),],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideHttpClient(), InAppBrowser],
  bootstrap: [AppComponent],
})
export class AppModule {}
