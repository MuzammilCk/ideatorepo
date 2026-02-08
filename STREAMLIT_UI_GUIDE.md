# 🐍 Tactical UI for Streamlit (Python)

Since Streamlit controls the HTML structure, you cannot simply copy the React component code. Instead, you must **inject** the styles and use **HTML components** for the static parts (like the title), while overriding Streamlit's default widget styles.

## 1. The Setup (CSS Injection)

Copy this function into your Streamlit app (e.g., `utils/ui_styler.py`) and call `setup_tactical_style()` at the start of your main script.

```python
import streamlit as st

def setup_tactical_style():
    """Injects the Tactical Cyberpunk CSS into Streamlit"""
    st.markdown("""
        <style>
        /* 1. IMPORT FONTS & TAILWIND (via CDN for simplicity in Streamlit) */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        /* 2. THEME VARIABLES */
        :root {
            --color-nightBlack: #050505;
            --color-nightDark: #0a0a0a;
            --color-electricBlue: #3b82f6;
            --color-deepBlue: #1e3a8a;
            --font-main: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        /* 3. BASE BACKGROUND */
        .stApp {
            background-color: var(--color-nightBlack);
            color: white;
            font-family: var(--font-main);
        }
        
        /* 4. HIDE STREAMLIT DEFAULT HEADER/FOOTER */
        header[data-testid="stHeader"] { visibility: hidden; }
        footer { visibility: hidden; }

        /* 5. CUSTOM WIDGET STYLING */
        
        /* Text Input */
        div[data-testid="stTextInput"] input {
            background-color: var(--color-nightDark) !important;
            color: white !important;
            border: 1px solid #333 !important;
            border-radius: 8px !important;
            font-family: var(--font-mono) !important;
            text-transform: uppercase;
        }
        div[data-testid="stTextInput"] input:focus {
            border-color: var(--color-electricBlue) !important;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
        }
        
        /* Buttons - Skewed & Glowing */
        div[data-testid="stButton"] button {
            background-color: var(--color-electricBlue) !important;
            color: black !important;
            font-weight: 900 !important;
            text-transform: uppercase;
            letter-spacing: 2px;
            transform: skewX(-10deg);
            border: none !important;
            transition: all 0.2s ease;
        }
        div[data-testid="stButton"] button:hover {
            box-shadow: 0 0 15px var(--color-electricBlue);
            color: white !important;
        }
        div[data-testid="stButton"] button p {
            transform: skewX(10deg); /* Counter-skew text */
        }

        /* Background Ambience (Pseudo-element hack) */
        .stApp::before {
            content: "";
            position: fixed;
            top: -20%; left: -10%;
            width: 50%; height: 50%;
            background: rgba(30, 58, 138, 0.2);
            filter: blur(100px);
            border-radius: 50%;
            z-index: 0;
            pointer-events: none;
        }
        </style>
    """, unsafe_allow_html=True)
```

## 2. The Hero Title (HTML Component)

Streamlit's `st.title` is too limited. Use `st.markdown` with HTML to render the exact skewed/gradient text.

```python
def render_tactical_hero():
    st.markdown("""
        <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="
                font-family: 'Inter', sans-serif;
                font-weight: 900;
                font-size: 4rem;
                font-style: italic;
                transform: skewX(-6deg);
                margin: 0;
            ">
                <span style="color: white; text-shadow: 0 0 10px rgba(255,255,255,0.2);">IDEA</span>
                <span style="color: #3b82f6; margin: 0 10px;">//</span>
                <span style="
                    background: linear-gradient(to right, #3b82f6, white);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 15px rgba(59,130,246,0.6));
                    padding-right: 15px; /* Fix clipped text */
                ">REPO</span>
            </h1>
            <p style="
                color: rgba(59, 130, 246, 0.6);
                font-family: 'JetBrains Mono', monospace;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                margin-top: 1rem;
            ">
                Tactical Repository Reconnaissance
            </p>
        </div>
    """, unsafe_allow_html=True)
```

## 3. Usage Example

```python
import streamlit as st
from utils.ui_styler import setup_tactical_style, render_tactical_hero

# 1. Inject Styles
setup_tactical_style()

# 2. Render Header
render_tactical_hero()

# 3. Use Streamlit Widgets (They are now styled!)
st.text_input("ENTER MISSION PARAMETERS", placeholder="IRON MAN SUIT...")
st.button("INITIATE")
st.text_area("BLUEPRINT", value="...")
```
