/* eslint-disable react/prop-types */

// import React from 'react'

import { useEffect, useState } from "react";
import { FiTrash } from "react-icons/fi";
import { FaFire } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { motion } from "framer-motion";

const DragAndDropNotion = () => {
  return (
    <div className="h-screen w-full bg-neutral-900 text-neutral-50">
      <Board />
    </div>
  );
};

// _____________________________________________Column container
const Board = () => {
  const [cards, setCards] = useState([]);
  const [hasChecked, setHasChecked] = useState(false);

  // _________________________________Using local storage to store the data
  useEffect(() => {
    hasChecked && localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    const data = localStorage.getItem("cards");

    setCards(data ? JSON.parse(data) : []);
    setHasChecked(true);
  }, []);

  return (
    <div className="w-full h-full flex gap-6 overflow-scroll p-12">
      <Column
        title="Backlog"
        column="backlog"
        headingColor="text-neutral-100"
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="Todo"
        column="todo"
        headingColor="text-yellow-300"
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="In Progress"
        column="doing"
        headingColor="text-blue-300"
        cards={cards}
        setCards={setCards}
      />
      <Column
        title="Complete"
        column="done"
        headingColor="text-emerald-300"
        cards={cards}
        setCards={setCards}
      />
      <DeleteBucket setCards={setCards} />
    </div>
  );
};

// ____________________________________________Each column
const Column = ({ title, headingColor, column, cards, setCards }) => {
  const [active, setActive] = useState(false); // used to change the column background color when new card comes in that column

  // calback function passed to card component you'll see as you read the code
  const handleDragStart = (e, card) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  // this function will trigger when you drop card into another column
  const handleDragEnd = (e) => {
    const cardId = e.dataTransfer.getData("cardId");
    setActive(false);
    clearIndicators();

    // droped card showing logic
    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);
    const before = element.dataset.before || "-1";

    if (before !== cardId) {
      let copy = [...cards];

      let cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;

      cardToTransfer = { ...cardToTransfer, column };

      copy = copy.filter((c) => c.id !== cardId);

      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(cardToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === undefined) return;

        copy.splice(insertAtIndex, 0, cardToTransfer);
      }

      setCards(copy);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearIndicators = (els) => {
    const indicators = els || getIndicators();

    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e) => {
    const indicators = getIndicators();
    const el = getNearestIndicator(e, indicators);
    clearIndicators(indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e, indicators) => {
    const DISTANCE_OFFSET = 50;
    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
  };

  const handleDragLeave = () => {
    clearIndicators();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  return (
    <div className="w-56 shrink-0">
      <div className="mb-3 flex items-center justify-between ">
        <h3 className={`font-medium ${headingColor} pointer-events-none`}>
          {title}
        </h3>
        <span className="rounded text-sm text-neutral-400 pointer-events-none">
          {filteredCards.length}
        </span>
      </div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDragEnd}
        className={`h-full w-full transition-colors ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
      >
        {filteredCards.map((c) => (
          <Card key={c.id} {...c} handleDragStart={handleDragStart} />
        ))}
        <DragIndicator beforeId={null} column={column} />
        <AddCard column={column} setCards={setCards} />
      </div>
    </div>
  );
};

// ____________________________________________Delete Bucket
const DeleteBucket = ({ setCards }) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = (e) => {
    const cardId = e.dataTransfer.getData("cardId");
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setActive(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDragEnd}
      className={`mt-10 p-0 h-56 w-56 rounded-md grid place-content-center border text-3xl ${
        active
          ? "border-red-800 bg-red-800/20 text-red-500"
          : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

// ____________________________________________Creating new Card
const AddCard = ({ column, setCards }) => {
  const [title, setTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim().length) return;

    const newTask = {
      column,
      title: title.trim(),
      id: Math.random().toString(),
    };

    setCards((prev) => [...prev, newTask]);
    setIsAdding(false);
  };

  return (
    <>
      {isAdding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded-md border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-none"
          />
          <div className="flex items-center justify-end gap-1.5 mt-0">
            <button
              className="px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-50"
              onClick={() => setIsAdding(false)}
            >
              Close
            </button>
            <button
              className="flex items-center gap-1.5 rounded text-xs transition-colors hover:bg-neutral-300 px-3 py-1.5 bg-neutral-50  text-neutral-950"
              type="submit"
            >
              <span>Add</span> <FiPlus />{" "}
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};

// ___________________________________________Single card
const Card = ({ title, id, column, handleDragStart }) => {
  return (
    <>
      <DragIndicator beforeId={id} column={column} />
      <motion.div
        layout
        layoutId={id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, { title, id, column })}
        className="cursor-grab p-3 border border-neutral-700 bg-neutral-800 rounded-md active:cursor-grab"
      >
        <p className="text-sm text-neutral-100">{title}</p>
      </motion.div>
    </>
  );
};

//__________________________________________Drag Indicator

const DragIndicator = ({ beforeId, column }) => {
  return (
    <div
      data-before={beforeId || -1}
      data-column={column}
      className="my-0.5 h-0.5 bg-violet-500 opacity-0 w-full"
    />
  );
};

export default DragAndDropNotion;
