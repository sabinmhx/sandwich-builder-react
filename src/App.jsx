import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';

// Ingredient component that can be dragged
const Ingredient = ({ item, type, onDrop }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { ...item, ingredientType: type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`ingredient-item ${isDragging ? 'dragging' : ''}`}
      title={`${item.name} ($${item.price.toFixed(2)})`}
    >
      <span className="ingredient-emoji">{item.image}</span>
      <span className="ingredient-name">{item.name}</span>
    </div>
  );
};

// Sandwich drop zone component
const SandwichDropZone = ({ sandwichLayers, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['bread', 'protein', 'cheese', 'veggie', 'condiment'],
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop} 
      className={`sandwich-display ${isOver ? 'drop-active' : ''}`}
    >
      {sandwichLayers.length > 0 ? (
        sandwichLayers
      ) : (
        <div className="empty-sandwich">
          Drag ingredients here to build your sandwich!
        </div>
      )}
    </div>
  );
};

const SandwichBuilder = () => {
  // Available ingredients with their properties
  const ingredients = {
    bread: [
      { id: 1, name: 'White Bread', image: '🍞', price: 1, layer: 'bread' },
      { id: 2, name: 'Whole Wheat', image: '🥖', price: 1.5, layer: 'bread' },
      { id: 3, name: 'Sourdough', image: '🥪', price: 2, layer: 'bread' },
    ],
    protein: [
      { id: 1, name: 'Turkey', image: '🦃', price: 2, layer: 'protein' },
      { id: 2, name: 'Ham', image: '🐷', price: 2.5, layer: 'protein' },
      { id: 3, name: 'Tofu', image: '🧈', price: 1.5, layer: 'protein' },
      { id: 4, name: 'Chicken', image: '🐔', price: 2.25, layer: 'protein' },
    ],
    cheese: [
      { id: 1, name: 'Cheddar', image: '🧀', price: 1, layer: 'cheese' },
      { id: 2, name: 'Swiss', image: '🧀', price: 1.25, layer: 'cheese' },
      { id: 3, name: 'Provolone', image: '🧀', price: 1.5, layer: 'cheese' },
    ],
    veggies: [
      { id: 1, name: 'Lettuce', image: '🥬', price: 0.5, layer: 'veggie' },
      { id: 2, name: 'Tomato', image: '🍅', price: 0.75, layer: 'veggie' },
      { id: 3, name: 'Onion', image: '🧅', price: 0.5, layer: 'veggie' },
      { id: 4, name: 'Avocado', image: '🥑', price: 1.5, layer: 'veggie' },
    ],
    condiments: [
      { id: 1, name: 'Mayo', image: '🥄', price: 0.25, layer: 'condiment' },
      { id: 2, name: 'Mustard', image: '🥄', price: 0.25, layer: 'condiment' },
      { id: 3, name: 'Ketchup', image: '🥄', price: 0.25, layer: 'condiment' },
    ],
  };

  // State for sandwich layers
  const [sandwichLayers, setSandwichLayers] = useState([]);
  const [score, setScore] = useState(0);
  const [totalMade, setTotalMade] = useState(0);

  // Handle dropping an ingredient onto the sandwich
  const handleDrop = (item) => {
    // If bread is being added, we need special handling
    if (item.layer === 'bread') {
      // Check if we already have bread
      const hasBread = sandwichLayers.some(layer => layer.props['data-layer'] === 'bread');
      
      if (!hasBread) {
        // Add both top and bottom bread
        setSandwichLayers([
          createLayer({ ...item, position: 'bottom' }),
          createLayer({ ...item, position: 'top' })
        ]);
        return;
      } else {
        // Replace existing bread
        setSandwichLayers(prev => {
          const newLayers = prev.filter(layer => layer.props['data-layer'] !== 'bread');
          return [
            createLayer({ ...item, position: 'bottom' }),
            ...newLayers,
            createLayer({ ...item, position: 'top' })
          ];
        });
        return;
      }
    }
    
    // For other ingredients, add them between the bread slices
    setSandwichLayers(prev => {
      const topBreadIndex = prev.findIndex(layer => 
        layer.props['data-layer'] === 'bread' && layer.props['data-position'] === 'top'
      );
      
      if (topBreadIndex === -1) {
        // No bread yet, just add to the end
        return [...prev, createLayer(item)];
      }
      
      // Insert before the top bread
      const newLayers = [...prev];
      newLayers.splice(topBreadIndex, 0, createLayer(item));
      return newLayers;
    });
  };

  // Create a visual layer for the sandwich
  const createLayer = (item) => {
    return (
      <div
        key={`${item.layer}-${Date.now()}-${Math.random()}`}
        className={`ingredient-layer ${item.layer} ${item.position || ''}`}
        data-layer={item.layer}
        data-position={item.position}
      >
        {item.image}
      </div>
    );
  };

  // Build the sandwich and calculate score
  const buildSandwich = () => {
    if (sandwichLayers.length === 0) {
      alert('Please add some ingredients to build your sandwich!');
      return;
    }
    
    setTotalMade(prev => prev + 1);
    
    // Calculate score
    let sandwichScore = 0;
    const bread = sandwichLayers.find(layer => layer.props['data-layer'] === 'bread');
    if (bread) {
      // Find the original bread item to get price
      const breadItem = ingredients.bread.find(b => b.image === bread.props.children);
      sandwichScore += breadItem.price * 2; // Both slices
    }
    
    // Calculate other ingredients
    sandwichLayers.forEach(layer => {
      const layerType = layer.props['data-layer'];
      if (layerType !== 'bread') {
        const category = 
          layerType === 'protein' ? 'protein' :
          layerType === 'cheese' ? 'cheese' :
          layerType === 'veggie' ? 'veggies' :
          'condiments';
        
        const item = ingredients[category].find(i => i.image === layer.props.children);
        if (item) sandwichScore += item.price;
      }
    });
    
    setScore(prev => prev + sandwichScore);
    alert(`Sandwich built! Added ${sandwichScore.toFixed(2)} points to your score.`);
  };

  // Reset the current sandwich
  const resetSandwich = () => {
    setSandwichLayers([]);
  };

  // Render the ingredient panel
  const renderIngredientPanel = () => {
    return (
      <div className="ingredient-panel">
        <h2>Ingredients</h2>
        
        <div className="ingredient-category">
          <h3>Bread (Drag to add both slices)</h3>
          <div className="ingredient-grid">
            {ingredients.bread.map(item => (
              <Ingredient 
                key={`bread-${item.id}`} 
                item={item} 
                type="bread" 
              />
            ))}
          </div>
        </div>
        
        <div className="ingredient-category">
          <h3>Protein</h3>
          <div className="ingredient-grid">
            {ingredients.protein.map(item => (
              <Ingredient 
                key={`protein-${item.id}`} 
                item={item} 
                type="protein" 
              />
            ))}
          </div>
        </div>
        
        <div className="ingredient-category">
          <h3>Cheese</h3>
          <div className="ingredient-grid">
            {ingredients.cheese.map(item => (
              <Ingredient 
                key={`cheese-${item.id}`} 
                item={item} 
                type="cheese" 
              />
            ))}
          </div>
        </div>
        
        <div className="ingredient-category">
          <h3>Veggies</h3>
          <div className="ingredient-grid">
            {ingredients.veggies.map(item => (
              <Ingredient 
                key={`veggie-${item.id}`} 
                item={item} 
                type="veggie" 
              />
            ))}
          </div>
        </div>
        
        <div className="ingredient-category">
          <h3>Condiments</h3>
          <div className="ingredient-grid">
            {ingredients.condiments.map(item => (
              <Ingredient 
                key={`condiment-${item.id}`} 
                item={item} 
                type="condiment" 
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="sandwich-builder">
        <h1>🥪 Drag & Drop Sandwich Builder 🍽️</h1>
        
        <div className="game-stats">
          <p>Total Sandwiches Made: <strong>{totalMade}</strong></p>
          <p>Total Score: <strong>${score.toFixed(2)}</strong></p>
        </div>
        
        <div className="sandwich-container">
          <div className="sandwich-preview">
            <h2>Your Sandwich</h2>
            <SandwichDropZone 
              sandwichLayers={sandwichLayers} 
              onDrop={handleDrop} 
            />
          </div>
          
          <div className="sandwich-controls">
            <button onClick={buildSandwich} className="build-btn">
              Build Sandwich!
            </button>
            <button onClick={resetSandwich} className="reset-btn">
              Reset Current
            </button>
          </div>
        </div>
        
        {renderIngredientPanel()}
      </div>
    </DndProvider>
  );
};

export default SandwichBuilder;