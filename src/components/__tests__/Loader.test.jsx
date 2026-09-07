import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader Component', () => {
  it('renders with the default loading text', () => {
    render(<Loader />);

    const textElement = screen.getByText('Loading...');
    expect(textElement).toBeInTheDocument();
    expect(textElement).toHaveClass('uppercase', 'animate-pulse');
  });

  it('renders with custom text when passed as a prop', () => {
    render(<Loader text="Fetching tracks..." />);

    expect(screen.getByText('Fetching tracks...')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('does not render the text element when text prop is an empty string', () => {
    const { container } = render(<Loader text="" />);

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });

  it('renders all structural spinner elements and animation classes', () => {
    const { container } = render(<Loader />);

    // Outer pulse ring
    const pingRing = container.querySelector('.animate-ping');
    expect(pingRing).toBeInTheDocument();
    expect(pingRing).toHaveClass('rounded-full', 'bg-brown/20');

    // Spinning arc
    const spinnerArc = container.querySelector('.animate-spin');
    expect(spinnerArc).toBeInTheDocument();
    expect(spinnerArc).toHaveClass('border-t-tan', 'border-r-brown');

    // Inner center dot
    const centerDot = container.querySelector('.bg-sand\\/80');
    expect(centerDot).toBeInTheDocument();
  });
});