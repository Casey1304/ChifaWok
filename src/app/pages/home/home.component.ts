import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductosService } from '../../services/productos.service';
import { CartService } from '../../services/cart.service';
import { VoiceAiService } from '../../services/voice-ai.service';
import { NotificationService } from '../../services/notification.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background">
      
      <!-- HERO SECTION -->
      <section class="relative w-full min-h-[620px] md:min-h-[700px] flex items-center overflow-hidden">
        <!-- Background Image with Gradient Overlay -->
        <div class="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=2000&q=80"
            alt="Wok a fuego vivo en Chifa Wok"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-900/80 to-transparent z-10"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent z-10"></div>
        </div>

        <div class="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <div class="max-w-2xl text-left space-y-6">
            
            <!-- Voice AI Feature Pill -->
            <div class="inline-flex items-center gap-2 bg-secondary-container/90 text-on-secondary-container px-3.5 py-1 rounded-full font-label-sm text-xs font-bold shadow-md">
              <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span>Integración de IA de Voz • Asistente Mei</span>
            </div>

            <!-- Headline -->
            <h1 class="font-display-lg text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-sm">
              Pide tu Chifa Favorito <span class="text-secondary-fixed">con la Voz</span>
            </h1>

            <p class="font-body-lg text-base sm:text-lg text-stone-300 leading-relaxed max-w-xl">
              Nuestra asistente conversacional Mei toma tu orden en lenguaje natural peruano. Pide "bien taipá", "al toque" o "sin cebollita china" sin demoras ni llamadas colapsadas.
            </p>

            <!-- Call to Actions -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                (click)="voice.openModal()"
                class="px-7 py-3.5 rounded-full bg-primary text-on-primary font-bold text-sm shadow-xl hover:bg-surface-tint hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
              >
                <span class="material-symbols-outlined text-xl">mic</span>
                <span>Hablar con Mei Ahora</span>
              </button>

              <a
                routerLink="/carta"
                class="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Explorar la Carta</span>
                <span class="material-symbols-outlined text-lg">restaurant_menu</span>
              </a>
            </div>

            <!-- Fast highlights -->
            <div class="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-md">
              <div>
                <p class="font-display-lg text-2xl font-black text-secondary-fixed">8.5 min</p>
                <p class="text-[11px] text-stone-400 font-medium">Salteado al Wok</p>
              </div>
              <div>
                <p class="font-display-lg text-2xl font-black text-secondary-fixed">98.4%</p>
                <p class="text-[11px] text-stone-400 font-medium">Precisión de Voz</p>
              </div>
              <div>
                <p class="font-display-lg text-2xl font-black text-secondary-fixed">100%</p>
                <p class="text-[11px] text-stone-400 font-medium">Sabor Tradicional</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- PLATOS ESTRELLA SECTION -->
      <section class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span class="text-xs font-bold uppercase tracking-widest text-primary">Nuestra Selección Maestra</span>
            <h2 class="font-display-lg text-2xl sm:text-3xl font-black text-on-surface mt-1">Platos Estrella al Wok</h2>
            <p class="text-sm text-on-surface-variant mt-1">Platos icónicos preparados al momento con el auténtico fuego del Wok Hei.</p>
          </div>
          <a
            routerLink="/carta"
            class="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Ver toda la carta</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            *ngFor="let prod of productosService.productosDestacados()"
            class="rounded-2xl border border-outline-variant/40 bg-surface overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
          >
            <div class="relative h-48 overflow-hidden bg-surface-container">
              <img
                [src]="prod.imagen"
                [alt]="prod.nombre"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-black text-xs shadow-xs">
                S/ {{ prod.precio.toFixed(2) }}
              </span>
              <span *ngIf="prod.porciones" class="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                {{ prod.porciones }}
              </span>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-secondary">
                  {{ prod.categoria_nombre }}
                </span>
                <h3 class="font-headline-md text-base font-bold text-on-surface mt-0.5 group-hover:text-primary transition-colors">
                  {{ prod.nombre }}
                </h3>
                <p class="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                  {{ prod.descripcion }}
                </p>
              </div>

              <div class="flex items-center gap-2 pt-2 border-t border-surface-container">
                <button
                  (click)="agregar(prod)"
                  class="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-surface-tint shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-base">add_shopping_cart</span>
                  Agregar al Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- VOICE BANNER SECTION -->
      <section class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="rounded-3xl bg-gradient-to-r from-tertiary-container via-tertiary to-stone-900 p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="relative z-10 max-w-xl space-y-4">
            <span class="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
              Tecnología Voice AI Nativa
            </span>
            <h3 class="font-display-lg text-2xl sm:text-3xl font-black leading-tight">
              ¿Tienes hambre y poco tiempo? Habla directamente con Mei
            </h3>
            <p class="text-sm text-blue-100 leading-relaxed">
              Dile tu pedido como si estuvieras en el mostrador del Chifa: "Quiero un chaufa especial, una sopa wantán y una Inka Kola de litro". Mei lo estructura, lo confirma y lo envía directo a la cocina.
            </p>
            <div class="pt-2">
              <button
                (click)="voice.openModal()"
                class="px-6 py-3 rounded-full bg-white text-tertiary hover:bg-amber-100 font-black text-xs sm:text-sm shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-lg">mic</span>
                Probar Asistente de Voz Mei
              </button>
            </div>
          </div>

          <div class="relative z-10 shrink-0 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-white/10 backdrop-blur-md p-4 flex items-center justify-center border border-white/20 shadow-inner">
            <div class="w-full h-full rounded-full bg-white flex items-center justify-center text-primary shadow-xl p-3">
              <img src="/chifawok_logo.svg" alt="Chifa Wok Logo" class="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      <!-- STORYTELLING: TRADICIÓN CON VISIÓN DE FUTURO -->
      <section class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-6">
            <span class="text-xs font-bold uppercase tracking-widest text-primary">Nuestra Esencia</span>
            <h2 class="font-display-lg text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
              Tradición con Visión de Futuro
            </h2>
            <p class="text-sm text-on-surface-variant leading-relaxed">
              Fundado en el corazón de Lima, Chifa Wok nació de la pasión por la auténtica cocina peruano-china y el deseo de revolucionar la experiencia gastronómica. Honramos las tradiciones centenarias del wok hei, el aliento del wok, al tiempo que adoptamos tecnología de vanguardia.
            </p>
            <p class="text-sm text-on-surface-variant leading-relaxed">
              Nuestra misión es servir comida espectacular sin esperas. Al integrar Voice AI en nuestro sistema de pedidos, nos aseguramos de que sus deseos culinarios se traduzcan directamente a nuestra cocina con perfecta precisión, dejándole más tiempo para saborear los sabores.
            </p>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span class="material-symbols-outlined text-primary text-2xl mb-1">skillet</span>
                <h4 class="font-bold text-sm text-on-surface">Wok Hei Auténtico</h4>
                <p class="text-[11px] text-on-surface-variant mt-0.5">Salteado a más de 300°C con sellado perfecto de sabores.</p>
              </div>
              <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <span class="material-symbols-outlined text-primary text-2xl mb-1">memory</span>
                <h4 class="font-bold text-sm text-on-surface">Inteligencia Artificial</h4>
                <p class="text-[11px] text-on-surface-variant mt-0.5">Reconocimiento léxico adaptado a la jerga peruana de chifa.</p>
              </div>
            </div>
          </div>

          <div class="relative h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-surface-container">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
              alt="Ambiente moderno de Chifa Wok"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="border-t border-outline-variant/30 bg-surface-container-low py-12">
        <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-surface-container">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm">
                CW
              </div>
              <div>
                <p class="font-display-lg text-lg font-black text-primary">Chifa Wok</p>
                <p class="text-xs text-on-surface-variant">Fusión Peruano-China • Andean Dragon S.A.C.</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-6 text-xs font-semibold text-on-surface-variant">
              <a routerLink="/carta" class="hover:text-primary">Carta Completa</a>
              <a routerLink="/mis-pedidos" class="hover:text-primary">Mis Pedidos</a>
              <a routerLink="/login" class="hover:text-primary">Acceso Personal</a>
              <button (click)="voice.openModal()" class="hover:text-primary font-bold text-tertiary">Asistente Mei</button>
            </div>
          </div>

          <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <p>© 2026 Chifa Wok Perú S.A.C. Todos los derechos reservados. Lima, Perú.</p>
            <p class="text-[11px]">Diseñado para alta concurrencia con Angular 18 & Web Speech API.</p>
          </div>
        </div>
      </footer>

    </div>
  `
})
export class HomeComponent {
  constructor(
    public productosService: ProductosService,
    private cart: CartService,
    public voice: VoiceAiService,
    private notification: NotificationService
  ) {}

  agregar(prod: Producto): void {
    this.cart.addItem(prod, 1);
    this.notification.success('Plato Agregado', `${prod.nombre} añadido al pedido.`);
  }
}
