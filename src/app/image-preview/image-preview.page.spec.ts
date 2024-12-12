import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImagePreviewPage } from './image-preview.page';

describe('ImagePreviewPage', () => {
  let component: ImagePreviewPage;
  let fixture: ComponentFixture<ImagePreviewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ImagePreviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
