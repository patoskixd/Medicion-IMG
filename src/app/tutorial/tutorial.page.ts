import { Component, AfterViewInit } from '@angular/core';
import Swiper from 'swiper';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
})
export class TutorialPage implements AfterViewInit {
  ngAfterViewInit() {
    new Swiper('.swiper-container', {
      pagination: { el: '.swiper-pagination', clickable: true },
    });
  }
}
