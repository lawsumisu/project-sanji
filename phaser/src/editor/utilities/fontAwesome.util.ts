import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAngleLeft,
  faAngleRight,
  faCopy,
  faCrosshairs,
  faFileCode,
  faFileImage,
  faFileDownload,
  faClipboard,
  faNotesMedical,
  faPaste
} from '@fortawesome/free-solid-svg-icons';
import {
  faClipboard as farClipboard,
  faCopy as farCopy,
}from '@fortawesome/free-regular-svg-icons';

export function initializeFontAwesome(): void {
  library.add(
    faAngleRight,
    faAngleLeft,
    faCopy,
    farCopy,
    faFileCode,
    faFileImage,
    faCrosshairs,
    faFileDownload,
    faClipboard,
    farClipboard,
    faNotesMedical,
    faPaste
  );
}
