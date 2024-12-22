import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor() {
    this.ShowSplash
  }
async ShowSplash(){
  await SplashScreen.show({
    showDuration: 3000,
    autoHide: true,
  });
}
}