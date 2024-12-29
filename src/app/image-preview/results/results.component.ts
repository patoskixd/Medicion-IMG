import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { MeasurementDialogComponent } from '../measurement-dialog/measurement-dialog.component';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent {
  @Input() history: { tramo: number; distancia: number; label?: string; marker1: { x: number; y: number }; marker2: { x: number; y: number }, image: string; }[] = [];
  @Input() unitOfMeasurement: string = '';

  selectedMap: { [key: number]: boolean } = {};
  isClearing: boolean = false;

  constructor(private modalController: ModalController, private alertController: AlertController) {}

  dismiss() {
    this.modalController.dismiss({
      updatedHistory: this.history,
    });
  }

  async addLabel(item: any) {
    const alert = await this.alertController.create({
      header: 'Agregar Etiqueta',
      inputs: [
        {
          name: 'label',
          type: 'text',
          placeholder: 'Etiqueta (ej. Célula 1)',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: (data) => {
            if (data.label) {
              item.label = data.label;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async viewMeasurement(item: any) {
    console.log('Datos enviados al modal:', {
      image: item.image,
      marker1: item.marker1,
      marker2: item.marker2,
      distancia: item.distancia,
      label: item.label,
      tramo: item.tramo,
    });

    const modal = await this.modalController.create({
      component: MeasurementDialogComponent,
      componentProps: {
        image: item.image,
        marker1: item.marker1,
        marker2: item.marker2,
        distance: item.distancia,
        unitOfMeasurement: this.unitOfMeasurement,
        tramo: item.tramo,
        label: item.label,
      },
    });
    await modal.present();
  }

  toggleSelection(tramo: number) {
    this.selectedMap[tramo] = !this.selectedMap[tramo];
  }

  async confirmDeleteSelected() {
    const selectedTramos = Object.keys(this.selectedMap)
      .filter((key) => this.selectedMap[+key])
      .map((key) => +key);

    if (selectedTramos.length === 0) {
      return;
    }

    const message = selectedTramos.length === 1
      ? `¿Estás seguro de eliminar la medición ${selectedTramos[0]}?`
      : `¿Estás seguro de eliminar las mediciones seleccionadas (${selectedTramos.join(', ')})?`;

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: () => this.deleteSelected(),
        },
      ],
    });

    await alert.present();
  }

  deleteSelected() {
    this.history = this.history.filter((item) => !this.selectedMap[item.tramo]);
    this.selectedMap = {};
    this.history.forEach((item, index) => {
      item.tramo = index + 1;
    });

    if (this.history.length === 0) {
      this.isClearing = false;
    }
  }

  async clearAll() {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar todas las mediciones? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.history = [];
            this.selectedMap = {};
            this.isClearing = false;
          },
        },
      ],
    });

    await alert.present();
  }

  enterClearingMode() {
    this.isClearing = true;
  }

  cancelClearing() {
    this.isClearing = false;
    this.selectedMap = {};
  }
}

