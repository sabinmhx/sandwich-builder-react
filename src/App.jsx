import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';
import { useEffect } from 'react';



const Ingredient = ({ item, type, disabled, locked }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item,
    canDrag: !disabled && !locked,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item, disabled, locked]);

  return (
    <div
      ref={drag}
      className={`ingredient-item ${isDragging ? 'dragging' : ''} ${disabled || locked ? 'disabled' : ''}`}
      title={`${item.name}${disabled ? ' - Please add bread first' : ''}${locked ? ' - Premium ingredient' : ''}`}
    >
      <span className="ingredient-emoji">{item.image}</span>
      <span className="ingredient-name">{item.name}</span>
      <span className="ingredient-price">${item.price.toFixed(2)}</span>
      {(disabled || locked) && <div className="disabled-overlay"></div>}
    </div>
  );
};

const SandwichDropZone = ({ sandwichLayers, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['bread', 'protein', 'cheese', 'veggie', 'condiment'],
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} className={`sandwich-display ${isOver ? 'drop-active' : ''}`}>
      {sandwichLayers.length > 0
        ? sandwichLayers
        : <div className="empty-sandwich">Start by adding bread to build your sandwich</div>}
    </div>
  );
};

// --- Utility Functions ---
const hasBread = (layers) => layers.some(layer => layer.props['data-layer'] === 'bread');

const createLayer = (item) => (
  <div
    key={`${item.layer}-${Date.now()}-${Math.random()}`}
    className={`ingredient-layer ${item.layer} ${item.position || ''}`}
    data-layer={item.layer}
    data-position={item.position}
  >
    {item.image}
  </div>
);

const SandwichBuilder = () => {
  const [sandwichLayers, setSandwichLayers] = useState([]);
  const [score, setScore] = useState(0);
  const [totalMade, setTotalMade] = useState(0);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [challengeSubmissions, setChallengeSubmissions] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});

  const ingredients = {
    bread: [
      { id: 1, name: 'White Bread', image: '🍞', price: 1, layer: 'bread' },
      { id: 2, name: 'Whole Wheat', image: '🥖', price: 1.5, layer: 'bread' },
      { id: 3, name: 'Sourdough', image: '🥪', price: 2, layer: 'bread' },
      { id: 4, name: 'Brioche Bun', image: '🍔', price: 2.5, layer: 'bread', isPremium: true },
    ],
    protein: [
      { id: 1, name: 'Turkey', image: '🦃', price: 2, layer: 'protein' },
      { id: 2, name: 'Ham', image: '🐷', price: 2.5, layer: 'protein' },
      { id: 3, name: 'Tofu', image: '🧈', price: 1.5, layer: 'protein' },
      { id: 4, name: 'Chicken', image: '🐔', price: 2.25, layer: 'protein' },
      { id: 5, name: 'Roast Beef', image: '🥩', price: 3, layer: 'protein', isPremium: true },
    ],
    cheese: [
      { id: 1, name: 'Cheddar', image: '🧀', price: 1, layer: 'cheese' },
      { id: 2, name: 'Swiss', image: '🧀', price: 1.25, layer: 'cheese' },
      { id: 3, name: 'Provolone', image: '🧀', price: 1.5, layer: 'cheese' },
      { id: 4, name: 'Pepper Jack', image: '🧀', price: 1.75, layer: 'cheese' },
    ],
    veggies: [
      { id: 1, name: 'Lettuce', image: '🥬', price: 0.5, layer: 'veggie' },
      { id: 2, name: 'Tomato', image: '🍅', price: 0.75, layer: 'veggie' },
      { id: 3, name: 'Onion', image: '🧅', price: 0.5, layer: 'veggie' },
      { id: 4, name: 'Avocado', image: '🥑', price: 1.5, layer: 'veggie', isPremium: true },
      { id: 5, name: 'Bell Pepper', image: '🫑', price: 0.75, layer: 'veggie' },
      { id: 6, name: 'Cucumber', image: '🥒', price: 0.5, layer: 'veggie' },
    ],
    condiments: [
      { id: 1, name: 'Mayo', image: '💧', price: 0.25, layer: 'condiment' },
      { id: 2, name: 'Mustard', image: '💛', price: 0.25, layer: 'condiment' },
      { id: 3, name: 'Ketchup', image: '❤️', price: 0.25, layer: 'condiment' },
      { id: 4, name: 'Hot Sauce', image: '🌶️', price: 0.5, layer: 'condiment', isPremium: true },
      { id: 5, name: 'Pesto', image: '🌿', price: 0.75, layer: 'condiment', isPremium: true },
    ],
  };

  const onDrop = (item) => {
    setSandwichLayers(prev => {
      const hasBreadAlready = hasBread(prev);

      // Handle bread drop
      if (item.layer === 'bread') {
        const breadLayers = [
          createLayer({ ...item, position: 'bottom' }),
          createLayer({ ...item, position: 'top' }),
        ];

        if (!hasBreadAlready) {
          return breadLayers;
        } else {
          const withoutBread = prev.filter(layer => layer.props['data-layer'] !== 'bread');
          return [
            createLayer({ ...item, position: 'bottom' }),
            ...withoutBread,
            createLayer({ ...item, position: 'top' }),
          ];
        }
      }

      if (item.isPremium && !premiumUnlocked) {
        alert('This is a premium ingredient. Unlock premium to use it!');
        return prev;
      }

      if (!hasBreadAlready) {
        alert('Please add bread first!');
        return prev;
      }

      const topBreadIndex = prev.findIndex(layer =>
        layer.props['data-layer'] === 'bread' && layer.props['data-position'] === 'top');
      const newLayer = createLayer(item);
      if (topBreadIndex === -1) return [...prev, newLayer];
      const newLayers = [...prev];
      newLayers.splice(topBreadIndex, 0, newLayer);
      return newLayers;
    });
  };

  const calculateSandwichPrice = () => {
    const allItems = Object.values(ingredients).flat();
    let total = 0;
    sandwichLayers.forEach(layer => {
      const found = allItems.find(i => i.image === layer.props.children);
      if (found) total += (found.layer === 'bread' ? found.price * 0.5 : found.price);
    });
    return total.toFixed(2);
  };

  const buildSandwich = () => {
    if (!hasBread(sandwichLayers)) return alert('Add bread first!');
    const price = parseFloat(calculateSandwichPrice());
    setScore(score + price);
    setTotalMade(totalMade + 1);
  };

  const saveSandwich = () => {
    const simpleLayers = sandwichLayers.map(layer => ({
      image: layer.props.children,
      layer: layer.props['data-layer'],
      position: layer.props['data-position'] || '',
    }));
    localStorage.setItem('savedSandwich', JSON.stringify(simpleLayers));
  };

  const submitToChallenge = () => {
    const simpleLayers = sandwichLayers.map(layer => ({
      image: layer.props.children,
      layer: layer.props['data-layer'],
      position: layer.props['data-position'] || '',
    }));
    const id = `submission-${Date.now()}`;
    setChallengeSubmissions([{ id, layers: simpleLayers }, ...challengeSubmissions]);
  };

  const vote = (id) => {
    setVoteCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

    const shareSandwich = () => {
    const simpleLayers = sandwichLayers.map(layer => ({
      image: layer.props.children,
      layer: layer.props['data-layer'],
      position: layer.props['data-position'] || '',
    }));

    const encoded = btoa(JSON.stringify(simpleLayers));
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
      alert('Shareable link copied to clipboard!');
    }).catch(err => {
      alert('Failed to copy link. Please try again.');
    });

    useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get('s');
  if (shared) {
    try {
      const decoded = JSON.parse(atob(shared));
      const layers = decoded.map(item => createLayer(item));
      setSandwichLayers(layers);
    } catch (err) {
      console.error('Invalid shared sandwich data.');
    }
  }
}, []);

  };


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="sandwich-builder">
        <div className="app-header">
          <h1>🥪 Sandwich Studio 🍽️</h1>
          <p className="app-tagline">Craft, save, and share your perfect sandwich!</p>
        </div>

        <div className="game-stats">
          <div className="stat-item"><span className="stat-label">Sandwiches</span><span className="stat-value">{totalMade}</span></div>
          <div className="stat-item"><span className="stat-label">Total Value</span><span className="stat-value">${score.toFixed(2)}</span></div>
          <div className="stat-item"><span className="stat-label">Current Price</span><span className="stat-value">${calculateSandwichPrice()}</span></div>
        </div>

        <div className="main-container">
          <div className="sandwich-section">
            <h2 className="section-title">Your Sandwich</h2>
            <SandwichDropZone sandwichLayers={sandwichLayers} onDrop={onDrop} />
            <div className="sandwich-controls">
              <button className="build-btn" onClick={buildSandwich}>Finish</button>
              <button className="reset-btn" onClick={() => setSandwichLayers([])}>Reset</button>
              {/* <button className="build-btn" onClick={saveSandwich}>Save</button> */}
              <button className="build-btn" onClick={shareSandwich}>Share</button>
              <button className="build-btn" onClick={submitToChallenge}>Submit to Challenge</button>
              <button className="build-btn" onClick={() => setPremiumUnlocked(true)}>Unlock Premium</button>
            </div>
          </div>
          <br/>
          <div className="ingredients-section">
            <h2 className="section-title">Ingredients</h2>
            <div className="ingredients-container">
              <div className="ingredient-panel">
                {Object.entries(ingredients).map(([category, items]) => (
                  <div className="ingredient-category" key={category}>
                    <h3>{category}</h3>
                    <div className="ingredient-grid">
                      {items.map(item => (
                        <Ingredient
                          key={item.id}
                          item={item}
                          type={category === 'veggies' ? 'veggie' : category}
                          disabled={!hasBread(sandwichLayers) && category !== 'bread'}
                          locked={item.isPremium && !premiumUnlocked}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {challengeSubmissions.length > 0 && (
          <div className="challenge-section">
            <h2>🌟 Challenge Submissions</h2>
            <div className="challenge-scroll-container">
              {challengeSubmissions.map(sub => (
                <div key={sub.id} className="challenge-card">
                  <div className="sandwich-display challenge-sandwich">
                    {sub.layers.map((layer, i) => (
                      <div key={i} className={`ingredient-layer ${layer.layer} ${layer.position}`}>{layer.image}</div>
                    ))}
                  </div>
                  <button onClick={() => vote(sub.id)}>Vote</button>
                  <p>Votes: {voteCounts[sub.id] || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default SandwichBuilder;
