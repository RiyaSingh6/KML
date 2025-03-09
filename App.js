import React from 'react';
import './App.css';  
import KMLViewer from './KMLViewer';  // Import the KMLViewer component

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>KML Viewer Application</h1>
      </header>
      <main>
        <KMLViewer />  
      </main>
    </div>
  );
};

export default App;
