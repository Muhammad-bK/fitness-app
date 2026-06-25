import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { applyTheme } from '../../lib/theme';

function renderToggle() {
  applyTheme('dark');
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  it('toggles between dark and light mode', () => {
    renderToggle();

    const button = screen.getByRole('button', { name: 'Switch to light mode' });
    fireEvent.click(button);

    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });
});
