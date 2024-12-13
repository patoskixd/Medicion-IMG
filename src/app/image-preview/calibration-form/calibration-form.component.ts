import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-calibration-form',
  templateUrl: './calibration-form.component.html',
  styleUrls: ['./calibration-form.component.scss'],
})

export class CalibrationFormComponent {
  @Input() measuredDistance!: number; // Recibir la distancia medida como entrada

  public useMagnification = false;
  public magnificationOptions = [4, 10, 40, 100];
  public selectedMagnification: number | null = null;
  public knownDistance: number | null = null;
  public unitOfMeasurement: string = 'µm';

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  onMagnificationChange() {
    // Actualizar la distancia conocida según la ampliación seleccionada
    switch (this.selectedMagnification) {
      case 4:
        this.knownDistance = 4500;
        break;
      case 10:
        this.knownDistance = 1800;
        break;
      case 40:
        this.knownDistance = 450;
        break;
      case 100:
        this.knownDistance = 180;
        break;
      default:
        this.knownDistance = null;
    }
    console.log(`Ampliación seleccionada: ${this.selectedMagnification}x, distancia conocida: ${this.knownDistance}`);
  }

  save() {
    const scale = this.useMagnification && this.knownDistance
      ? this.knownDistance / this.measuredDistance
      : this.knownDistance && this.unitOfMeasurement
      ? this.knownDistance / this.measuredDistance
      : null;
  
    if (scale) {
      this.modalController.dismiss({
        scale,
        unit: this.useMagnification ? 'µm' : this.unitOfMeasurement,
      });
    } else {
      alert('Complete todos los campos para guardar la calibración.');
    }
  }
  
}
