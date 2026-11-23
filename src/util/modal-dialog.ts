// Scroll lock and backdrop click for native modal <dialog>s; `showModal()` itself gives the top layer,
// inert page, Esc and focus return. Trimmed from thingsboard.io's version: tbmq.io has one modal dialog (cookie
// preferences), so there is no stacking and no exit fade.

import { lockScroll, unlockScroll } from '@util/scroll-lock';

export interface ModalDialog {
	open(): void;
	close(): void;
}

const bound = new WeakMap<HTMLDialogElement, ModalDialog>();

// Binds once: a later call for the same dialog returns the first binding.
export function bindModalDialog(dialog: HTMLDialogElement): ModalDialog {
	const existing = bound.get(dialog);
	if (existing) return existing;

	// The panel fills the dialog box, so a click on the dialog element itself landed on the backdrop. The press
	// must have too: a text selection dragged out of a field ends with a click on the dialog.
	let pressedBackdrop = false;
	dialog.addEventListener('pointerdown', (e) => {
		pressedBackdrop = e.target === dialog;
	});
	dialog.addEventListener('click', (e) => {
		if (e.target === dialog && pressedBackdrop) modal.close();
	});

	// Esc, the close button (`<form method="dialog">`) and `close()` all end here.
	dialog.addEventListener('close', () => {
		// `close` is queued: the dialog may have been reopened before it fired.
		if (dialog.open) return;
		unlockScroll();
	});

	const modal: ModalDialog = {
		open() {
			if (dialog.open) return;
			dialog.showModal();
			lockScroll();
		},
		close() {
			if (dialog.open) dialog.close();
		},
	};
	bound.set(dialog, modal);
	return modal;
}
