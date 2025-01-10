import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';

@Component({
  imports: [RouterModule, FormsModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'angular';
  public readonly activeSignal = signal(0);
  public readonly sliderValue = signal(0);
  public readonly dom = inject(DOCUMENT);
  public readonly containerElement =
    viewChild.required<ElementRef<HTMLElement>>('container');

  public ngOnInit(): void {
    let isCtrlPressed = false;
    let isSelecting = false;
    let startX = 0;
    let startY = 0;
    let selectionArea: HTMLElement | null = null;
    const selectedItems = new Set();

    const startSelection = (x: number, y: number): void => {
      if (!isCtrlPressed) return;

      isSelecting = true;
      startX = x;
      startY = y;

      // Create selection area
      selectionArea = this.dom.createElement('div');
      selectionArea.classList.add('selection-area');
      this.dom.body.appendChild(selectionArea);
      selectionArea.style.left = `${startX}px`;
      selectionArea.style.top = `${startY}px`;
    };

    const updateSelection = (x: number, y: number): void => {
      if (!isSelecting || !selectionArea) return;

      selectionArea.style.left = `${Math.min(startX, x)}px`;
      selectionArea.style.top = `${Math.min(startY, y)}px`;
      selectionArea.style.width = `${Math.abs(startX - x)}px`;
      selectionArea.style.height = `${Math.abs(startY - y)}px`;

      const selectionRect = selectionArea.getBoundingClientRect();

      // Update class of items within the selection area
      this.dom.querySelectorAll('.item').forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const isInSelection =
          itemRect.left < selectionRect.right &&
          itemRect.right > selectionRect.left &&
          itemRect.top < selectionRect.bottom &&
          itemRect.bottom > selectionRect.top;

        if (isInSelection) {
          if (!selectedItems.has(item)) {
            selectedItems.add(item);
            item.classList.add('selected');
          }
        } else {
          if (selectedItems.has(item)) {
            selectedItems.delete(item);
            item.classList.remove('selected');
          }
        }
      });
    };

    const endSelection = (): void => {
      if (!isSelecting) return;

      isSelecting = false;

      // Cleanup
      selectionArea?.remove();
      selectionArea = null;
    };

    const selectAllItems = () => {
      const items = this.dom.querySelectorAll('.item');
      items.forEach((item) => {
        if (!selectedItems.has(item)) {
          selectedItems.add(item);
          item.classList.add('selected');
        }
      });
    };

    this.dom.addEventListener('keydown', (e) => {
      console.log('keydown', e.key);
      if (['Control', 'Meta'].includes(e.key)) {
        isCtrlPressed = true;
      }

      if (isCtrlPressed && e.key.toLowerCase() === 'a') {
        e.preventDefault(); // Prevent the default browser behavior
        selectAllItems();
      }
    });

    this.dom.addEventListener('keyup', (e) => {
      console.log('keydown', e.key);
      if (['Control', 'Meta'].includes(e.key)) {
        isCtrlPressed = false;
      }
    });

    this.containerElement().nativeElement.addEventListener('mousedown', (e) =>
      startSelection(e.clientX, e.clientY)
    );
    this.dom.addEventListener('mousemove', (e) =>
      updateSelection(e.clientX, e.clientY)
    );
    this.dom.addEventListener('mouseup', () => {
      console.log('mouseup');
      endSelection();
    });

    // Touch support
    this.containerElement().nativeElement.addEventListener(
      'touchstart',
      (e) => {
        const touch = e.touches[0];
        console.log('touchstart', touch);
        startSelection(touch.clientX, touch.clientY);
      }
    );
    this.containerElement().nativeElement.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      console.log('touchmove', touch);
      updateSelection(touch.clientX, touch.clientY);
    });
    this.containerElement().nativeElement.addEventListener('touchend', () => {
      console.log('touchend');
      endSelection();
    });
  }

  public ngOnDestroy(): void {
    this.dom.removeEventListener('keydown', () => {});
    this.dom.removeEventListener('keyup', () => {});
  }
}
