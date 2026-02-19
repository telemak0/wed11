// Setup file for Vitest
// Validates environment variables or global mocks
import '@testing-library/jest-dom';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/config/i18n';

// Basic mock for import.meta.env if needed
Object.defineProperty(global, 'import', {
    value: {
        meta: {
            env: {
                VITE_FIREBASE_API_KEY: 'test-api-key',
                VITE_FIREBASE_PROJECT_ID: 'test-project-id'
            }
        }
    }
});

// Custom render that includes i18nProvider
function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  function Wrapper({ children }: { children: ReactElement }) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from RTL
export * from '@testing-library/react';
export { render };
