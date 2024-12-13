import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  selectedImage: string | null = null;

  constructor(private router: Router) {}

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.selectedImage = reader.result as string; // Aquí ya tienes el base64
      };

      reader.readAsDataURL(file); // Convierte la imagen en base64 automáticamente
    }
  }

  confirmImage(): void {
    if (this.selectedImage) {
      this.router.navigate(['/image-preview'], { state: { image: this.selectedImage } });
    } else {
      console.warn('No hay imagen seleccionada aún.');
    }
  }
}
