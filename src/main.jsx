import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:'100vh',background:'#1a1a2e',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
          <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'16px',padding:'32px',maxWidth:'600px',width:'100%',border:'1px solid rgba(255,255,255,0.2)'}}>
            <h1 style={{color:'#f59e0b',fontWeight:900,fontSize:'20px',marginBottom:'16px'}}>⚠️ CRM Error</h1>
            <div style={{background:'rgba(0,0,0,0.4)',borderRadius:'8px',padding:'16px',fontFamily:'monospace',fontSize:'12px',color:'#f87171',wordBreak:'break-all',whiteSpace:'pre-wrap'}}>
              {this.state.error?.message || 'Unknown error'}{'\n\n'}{this.state.error?.stack?.slice(0,500)||''}
            </div>
            <button onClick={()=>window.location.reload()} style={{marginTop:'16px',background:'#d97706',color:'white',border:'none',borderRadius:'8px',padding:'10px 24px',fontWeight:700,cursor:'pointer'}}>Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary><App /></ErrorBoundary>
)
