import { Component, Input } from '@angular/core';
import { ModalController, AnimationController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-calibration-form',
  templateUrl: './calibration-form.component.html',
  styleUrls: ['./calibration-form.component.scss'],
})
export class CalibrationFormComponent {
  @Input() measuredDistance!: number;

  public useMagnification = false;
  public magnificationOptions = [4, 10, 40, 100];
  public fieldOfViewOptions = [18, 20]; // Opciones en mm
  public selectedMagnification: number | null = null;
  public selectedFieldOfView: number | null = null; 
  public knownDistance: number | null = null;
  public unitOfMeasurement: string = 'µm';

  constructor(
    private modalController: ModalController,
    private animationCtrl: AnimationController,
    private toastController: ToastController
  ) {}

  dismiss() {
    this.modalController.dismiss();
  }

  onMagnificationChange() {
    if (this.selectedFieldOfView && this.selectedMagnification) {
      // Calcular la distancia conocida en micrómetros
      const fieldOfViewMM = this.selectedFieldOfView;
      const magnification = this.selectedMagnification;
      this.knownDistance = (fieldOfViewMM / magnification) * 1000; // Convertir a micrómetros
      console.log(`Campo de visión: ${fieldOfViewMM}mm, Objetivo: ${magnification}x`);
      console.log(`Distancia conocida: ${this.knownDistance} µm`);
    } else {
      this.knownDistance = null;
    }
  }

  async save() {
    const scale = this.useMagnification && this.knownDistance
      ? this.knownDistance / this.measuredDistance
      : this.knownDistance && this.unitOfMeasurement
      ? this.knownDistance / this.measuredDistance
      : null;
  
    if (scale) {
      const saveAnimation = this.animationCtrl.create()
        .addElement(document.querySelector('.save-button')!)
        .duration(300)
        .keyframes([
          { offset: 0, transform: 'scale(1)' },
          { offset: 0.5, transform: 'scale(0.9)' },
          { offset: 1, transform: 'scale(1)' }
        ]);

      await saveAnimation.play();

      this.modalController.dismiss({
        scale,
        unit: this.useMagnification ? 'µm' : this.unitOfMeasurement,
      });
    } else {
      this.showError('Por favor, complete todos los campos.');
    }
  }

  private async showError(message: string) {
    const errorAnimation = this.animationCtrl.create()
      .addElement(document.querySelector('.calibration-container')!)
      .duration(100)
      .iterations(3)
      .keyframes([
        { offset: 0, transform: 'translateX(0)' },
        { offset: 0.5, transform: 'translateX(10px)' },
        { offset: 1, transform: 'translateX(0)' }
      ]);

    await errorAnimation.play();
    
    await this.showToast(message);
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }
}

