import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent {
  @Input() history: { tramo: number; distancia: number }[] = [];
  @Input() unitOfMeasurement: string = '';

  selectedMap: { [key: number]: boolean } = {}; // Mapa de selección de tramos
  isClearing: boolean = false; // Estado para mostrar controles de limpieza

  constructor(private modalController: ModalController, private alertController: AlertController) {}

  dismiss() {
    this.modalController.dismiss({
      updatedHistory: this.history,
    });
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

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar los tramos seleccionados (${selectedTramos.join(', ')})?`,
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

  async confirmClearAll() {
    const alert = await this.alertController.create({
      header: 'Confirmar limpieza',
      message: '¿Estás seguro de eliminar todos los tramos?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Limpiar todo',
          handler: () => this.clearAll(),
        },
      ],
    });

    await alert.present();
  }

  deleteSelected() {
    this.history = this.history.filter((item) => !this.selectedMap[item.tramo]);
    this.selectedMap = {}; // Reiniciar el mapa de selección
    this.history.forEach((item, index) => {
      item.tramo = index + 1; // Reordenar tramos
    });

    if (this.history.length === 0) {
      this.isClearing = false; // Salir del modo de limpieza si ya no hay elementos
    }
  }

  clearAll() {
    this.history = [];
    this.selectedMap = {}; 
    this.isClearing = false;
  }

  enterClearingMode() {
    this.isClearing = true; // Entrar en el modo de limpieza
  }

  cancelClearing() {
    this.isClearing = false; // Salir del modo de limpieza
    this.selectedMap = {}; // Limpiar el mapa de selección
  }

  exportToCSV() {
    // Lógica para exportar resultados a CSV
  }
}
