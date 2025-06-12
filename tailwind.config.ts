import type { Config } from "tailwindcss";
import { createSineWaveAnimation, createGlowAnimation } from "./src/lib/tailwind-animations";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				md: '2rem',
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				display: ['Lexend', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					50: 'hsl(var(--primary-50))',
					100: 'hsl(var(--primary-100))',
					200: 'hsl(var(--primary-200))',
					300: 'hsl(var(--primary-300))',
					400: 'hsl(var(--primary-400))',
					500: 'hsl(var(--primary-500))',
					600: 'hsl(var(--primary-600))',
					700: 'hsl(var(--primary-700))',
					800: 'hsl(var(--primary-800))',
					900: 'hsl(var(--primary-900))',
					950: 'hsl(var(--primary-950))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					50: 'hsl(var(--accent-50))',
					100: 'hsl(var(--accent-100))',
					200: 'hsl(var(--accent-200))',
					300: 'hsl(var(--accent-300))',
					400: 'hsl(var(--accent-400))',
					500: 'hsl(var(--accent-500))',
					600: 'hsl(var(--accent-600))',
					700: 'hsl(var(--accent-700))',
					800: 'hsl(var(--accent-800))',
					900: 'hsl(var(--accent-900))',
					950: 'hsl(var(--accent-950))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					hovered: 'hsl(var(--card-hovered))',
					pressed: 'hsl(var(--card-pressed))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				chat: {
					sent: 'hsl(var(--chat-sent))',
					received: 'hsl(var(--chat-received))',
					online: 'hsl(var(--chat-online))',
					offline: 'hsl(var(--chat-offline))',
					typing: 'hsl(var(--chat-typing))',
				},
				status: {
					online: 'hsl(var(--status-online))',
					offline: 'hsl(var(--status-offline))',
					busy: 'hsl(var(--status-busy))',
					away: 'hsl(var(--status-away))',
				}
			},
			boxShadow: {
				'glow-sm': '0 0 10px rgba(var(--primary), 0.3)',
				'glow-md': '0 0 15px rgba(var(--primary), 0.4)',
				'glow-lg': '0 0 20px rgba(var(--primary), 0.5)',
				'glow-xl': '0 0 30px rgba(var(--primary), 0.6)',
				'glow-accent': '0 0 15px rgba(var(--accent), 0.4)',
				'glow-accent-lg': '0 0 25px rgba(var(--accent), 0.5)',
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
				'card-hd': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				'neo': '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff',
				'float': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',
				'interactive': '0 4px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.025)',
				'interactive-hover': '0 8px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
				'button': '0 1px 2px rgba(0,0,0,0.05)',
				'button-hover': '0 2px 4px rgba(0,0,0,0.1)',
				'neubrutal': '6px 6px 0 0 rgb(var(--primary) / 100%)',
				'neubrutal-sm': '3px 3px 0 0 rgb(var(--primary) / 100%)',
				'neubrutal-lg': '10px 10px 0 0 rgb(var(--primary) / 100%)',
				'neubrutal-xl': '15px 15px 0 0 rgb(var(--primary) / 100%)',
				'inner-glow': 'inset 0 0 15px 0 rgba(var(--primary), 0.3)',
				'layered-1': '6px 6px 0 0 rgba(var(--foreground), 0.1), 12px 12px 0 0 rgba(var(--foreground), 0.05)',
				'layered-2': '4px 4px 0 0 rgba(var(--primary), 0.3), 8px 8px 0 0 rgba(var(--primary), 0.2)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.5rem',
				'4xl': '2rem',
				'5xl': '2.5rem',
				'curved-lg': '40% 60% 70% 30% / 40% 50% 60% 50%',
				'curved-md': '30% 70% 70% 30% / 30% 30% 70% 70%',
				'curved-sm': '20% 80% 80% 20% / 20% 20% 80% 80%',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				'slide-in': {
					'0%': { transform: 'translateX(-10px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-out': {
					'0%': { transform: 'translateX(0)', opacity: '1' },
					'100%': { transform: 'translateX(10px)', opacity: '0' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-down': {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'typing': {
					'0%': { width: '0' },
					'50%': { width: '100%' },
					'100%': { width: '0' }
				},
				'bounce': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'pulse-glow': {
					'0%, 100%': { opacity: '0.6' },
					'50%': { opacity: '1' }
				},
				'gradient-xy': {
					'0%': { backgroundPosition: '0% 0%' },
					'25%': { backgroundPosition: '100% 0%' },
					'50%': { backgroundPosition: '100% 100%' },
					'75%': { backgroundPosition: '0% 100%' },
					'100%': { backgroundPosition: '0% 0%' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-1000px 0' },
					'100%': { backgroundPosition: '1000px 0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'scale': {
					'0%': { transform: 'scale(0.95)' },
					'100%': { transform: 'scale(1)' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				'wiggle': {
					'0%, 100%': { transform: 'rotate(-3deg)' },
					'50%': { transform: 'rotate(3deg)' },
				},
				'ping-slow': {
					'75%, 100%': { transform: 'scale(1.5)', opacity: '0' },
				},
				'flip': {
					'0%': { transform: 'perspective(400px) rotateY(0)' },
					'100%': { transform: 'perspective(400px) rotateY(360deg)' },
				},
				'morph': {
					'0%': { borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' },
					'50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
					'100%': { borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' },
				},
				'text-gradient': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' },
				},
				'fade-in-blur': {
					'0%': { opacity: '0', filter: 'blur(5px)' },
					'100%': { opacity: '1', filter: 'blur(0)' },
				},
				'line-dance': {
					'0%, 100%': { backgroundPosition: '0% 0%' },
					'50%': { backgroundPosition: '100% 0%' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'slide-out': 'slide-out 0.3s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'slide-down': 'slide-down 0.3s ease-out',
				'typing': 'typing 2s steps(20) infinite',
				'bounce': 'bounce 1s ease infinite',
				'bounce-slow': 'bounce 3s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'gradient-xy': 'gradient-xy 15s ease infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'float': 'float 3s ease-in-out infinite',
				'float-slow': 'float 6s ease-in-out infinite',
				'scale': 'scale 0.3s ease-out',
				'spin-slow': 'spin-slow 6s linear infinite',
				'wiggle': 'wiggle 1s ease-in-out infinite',
				'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
				'flip': 'flip 6s linear infinite',
				'morph': 'morph 8s ease-in-out infinite',
				'text-gradient': 'text-gradient 3s ease infinite',
				'fade-in-blur': 'fade-in-blur 0.5s ease-out forwards',
				'line-dance': 'line-dance 3s linear infinite',
			},
			backdropBlur: {
				xs: '2px',
				sm: '4px',
				DEFAULT: '8px',
				md: '12px',
				lg: '16px',
				xl: '24px',
				'2xl': '32px',
				'3xl': '40px',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'gradient-shine': 'linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)',
				'gradient-diagonal': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
				'gradient-card': 'linear-gradient(145deg, var(--tw-gradient-stops))',
				'mesh-1': 'radial-gradient(at 0% 0%, hsla(var(--primary), 0.25) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(var(--accent), 0.25) 0px, transparent 50%)',
				'mesh-2': 'radial-gradient(at 50% 0%, hsla(var(--primary), 0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(var(--accent), 0.3) 0px, transparent 50%)',
				'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.8' seed='0'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
				'grid': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0V20M0 1H20' stroke='%23E5E7EB' stroke-opacity='0.5' stroke-width='1'/%3E%3C/svg%3E\")",
				'gradient-text': 'linear-gradient(90deg, var(--tw-gradient-stops))',
				'pulse-dot': "radial-gradient(circle, rgba(var(--primary), 0.7) 20%, transparent 70%)",
				'scale-dot': "radial-gradient(circle, rgba(var(--primary), 0.7) 10%, transparent 60%)",
				'diagonal-lines': "repeating-linear-gradient(45deg, rgba(var(--foreground), 0.05), rgba(var(--foreground), 0.05) 2px, transparent 2px, transparent 8px)",
				'mesh-dense': "radial-gradient(at 40% 20%, rgba(var(--primary), 0.2) 0px, transparent 30%), radial-gradient(at 80% 75%, rgba(var(--accent), 0.2) 0px, transparent 30%), radial-gradient(at 15% 75%, rgba(var(--secondary), 0.2) 0px, transparent 30%)",
				'wavy-lines': "url(\"data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10C30 10 30 0 60 0C90 0 90 10 120 10V20H0V10Z' fill='rgba(200,200,255,0.1)'/%3E%3C/svg%3E\")",
			},
			screens: {
				'xs': '480px',
				'3xl': '1600px',
				'4xl': '1920px',
			},
			transitionProperty: {
				'height': 'height',
				'spacing': 'margin, padding',
				'width': 'width',
				'border': 'border-color, border-width',
				'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
				'filter': 'filter, backdrop-filter',
				'text-shadow': 'text-shadow',
			},
			textShadow: {
				'sm': '0 1px 2px var(--tw-shadow-color)',
				'DEFAULT': '0 2px 4px var(--tw-shadow-color)',
				'lg': '0 8px 16px var(--tw-shadow-color)',
				'primary': '0 2px 8px rgba(var(--primary), 0.5)',
				'glow': '0 0 10px rgba(var(--primary), 0.8)',
				'contrast': '1px 1px 0px var(--tw-shadow-color), -1px -1px 0px var(--tw-shadow-color)',
			},
			typography: {
				DEFAULT: {
					css: {
						h1: {
							fontWeight: '800',
							fontFamily: 'var(--font-display)',
						},
						h2: {
							fontWeight: '700',
							fontFamily: 'var(--font-display)',
						},
						h3: {
							fontWeight: '600',
							fontFamily: 'var(--font-display)',
						},
					},
				},
			},
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require('@tailwindcss/typography'),
		function({ addUtilities, theme, addBase }) {
			// Text shadow utilities
			const textShadows = theme('textShadow');
			const textShadowUtilities = {};
			
			Object.entries(textShadows).forEach(([key, value]) => {
				textShadowUtilities[`.text-shadow${key === 'DEFAULT' ? '' : `-${key}`}`] = {
					'text-shadow': value,
				};
			});
			
			addUtilities(textShadowUtilities);
			
			// Glass morphism utilities
			addUtilities({
				'.glass-effect': {
					'background': 'rgba(255, 255, 255, 0.08)',
					'border': '1px solid rgba(255, 255, 255, 0.1)',
					'backdrop-filter': 'blur(12px)',
					'-webkit-backdrop-filter': 'blur(12px)',
				},
				'.glass-effect-dark': {
					'background': 'rgba(0, 0, 0, 0.2)',
					'border': '1px solid rgba(255, 255, 255, 0.05)',
					'backdrop-filter': 'blur(12px)',
					'-webkit-backdrop-filter': 'blur(12px)',
				},
				'.glass-card': {
					'background': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
					'backdrop-filter': 'blur(20px)',
					'-webkit-backdrop-filter': 'blur(20px)',
					'border': '1px solid rgba(255, 255, 255, 0.18)',
					'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
				},
			});
			
			// Neural brutalism utilities
			addUtilities({
				'.neubrutal': {
					'box-shadow': '6px 6px 0 0 rgb(var(--primary) / 100%)',
					'border': '2px solid rgb(var(--foreground) / 90%)',
				},
				'.neubrutal-sm': {
					'box-shadow': '3px 3px 0 0 rgb(var(--primary) / 100%)',
					'border': '1px solid rgb(var(--foreground) / 90%)',
				},
				'.neubrutal-lg': {
					'box-shadow': '10px 10px 0 0 rgb(var(--primary) / 100%)',
					'border': '3px solid rgb(var(--foreground) / 90%)',
				},
			});
			
			// Text gradient utilities
			addUtilities({
				'.text-gradient-primary': {
					'background': 'linear-gradient(to right, rgb(var(--primary)), rgb(var(--accent)))',
					'background-clip': 'text',
					'-webkit-background-clip': 'text',
					'color': 'transparent',
				},
				'.text-gradient-gold': {
					'background': 'linear-gradient(to right, #f59e0b, #f59e0b, #f43f5e)',
					'background-clip': 'text',
					'-webkit-background-clip': 'text',
					'color': 'transparent',
				},
				'.text-gradient-rainbow': {
					'background': 'linear-gradient(to right, #ff0000, #ffa500, #ffff00, #008000, #0000ff, #4b0082, #ee82ee)',
					'background-clip': 'text',
					'-webkit-background-clip': 'text',
					'color': 'transparent',
					'animation': 'text-gradient 3s ease infinite',
				},
			});
			
			// Custom scrollbars
			addUtilities({
				'.scrollbar-thin': {
					'scrollbar-width': 'thin',
					'&::-webkit-scrollbar': {
						'width': '6px',
						'height': '6px',
					},
					'&::-webkit-scrollbar-track': {
						'background': 'rgb(var(--muted) / 30%)',
					},
					'&::-webkit-scrollbar-thumb': {
						'background': 'rgb(var(--muted-foreground) / 50%)',
						'border-radius': '3px',
						'&:hover': {
							'background': 'rgb(var(--muted-foreground) / 70%)',
						},
					},
				},
				'.scrollbar-hidden': {
					'scrollbar-width': 'none',
					'-ms-overflow-style': 'none',
					'&::-webkit-scrollbar': {
						'display': 'none',
					},
				},
			});

			// Fancy fonts
			addBase({
				'@font-face': [
					{
						fontFamily: 'Lexend',
						fontWeight: '100 900',
						fontStyle: 'normal',
						fontDisplay: 'swap',
						src: "url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap')",
					},
					{
						fontFamily: 'JetBrains Mono',
						fontWeight: '100 800',
						fontStyle: 'normal',
						fontDisplay: 'swap',
						src: "url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap')",
					},
				],
			});
		}
	],
} satisfies Config;
