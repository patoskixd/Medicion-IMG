import { Component, AfterViewInit } from '@angular/core';
import Swiper from 'swiper';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
})
export class TutorialPage implements AfterViewInit {
  constructor(private router: Router) {}

  ngAfterViewInit() {
    new Swiper('.swiper-container', {
      pagination: { el: '.swiper-pagination', clickable: true },
    });
  }

  testAutoCalibration() {
    const testImage = 'assets/images/calibracion-automatica.jpg'; // Ruta de la imagen de prueba
    this.router.navigate(['/image-preview'], { state: { image: testImage, mode: 'auto' } });
  }

  testManualCalibration() {
    const testImage = 'assets/images/calibracion-manual.png'; // Ruta de la imagen de prueba
    this.router.navigate(['/image-preview'], { state: { image: testImage, mode: 'manual' } });
  }
}
