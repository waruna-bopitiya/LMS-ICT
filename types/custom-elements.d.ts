import type React from 'react'

// <helacode-badge> is a custom element used in the site footer. Declaring it
// keeps type checking enabled for the rest of the file.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'helacode-badge': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}

export {}
