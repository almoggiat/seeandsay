const words = [
  "cat", "dog", "sun", "hat", "box",
  "car", "pen", "map", "red", "cup",
  "fan", "toy", "jam", "bed", "key",
  "lip", "egg", "net", "owl", "pie"
];

function name_from_num(num) {
  if (num < 10) return num + ".png";
  return String.fromCharCode(65 + (num - 10)) + ".png";
}

function get_images(level) {
  if (level < 3) {
    const nums = new Set();
    while (nums.size < 3) {
      nums.add(Math.floor(Math.random() * 36));
    }
    return Array.from(nums).map(name_from_num);
  } else {
    const word_choice = new Set();
    while (word_choice.size < 3) {
      word_choice.add(words[Math.floor(Math.random() * words.length)]);
    }
    return Array.from(word_choice);
  }
}

function get_target(names, level) {
  const num = Math.floor(Math.random() * names.length);
  return level < 3 ? names[num].slice(0, 1) : names[num];
}

function Test() {
  let images_array = get_images(0);
  const [levelTracker, setLevel] = React.useState(0);
  const [images, setImages] = React.useState(images_array);
  const [target, setTarget] = React.useState(get_target(images_array, 0));
  const [message, setMessage] = React.useState("Click " + target);
  const [showContinue, setShowContinue] = React.useState(false);
  const [clickedLetter, setClickedLetter] = React.useState(null);
  const [transition, setTransition] = React.useState(false);

  React.useEffect(() => {
    console.log("Current level:", levelTracker);
  }, [levelTracker]);

  function levelUp() {
    setLevel((prev) => {
      if (prev === 1 || prev === 0) return prev + 1;
      if (levelTracker === 2) setTransition("lowToHigh");
      return 5;
    });
  }

  function levelDown() {
    setLevel((prev) => {
      if (prev === 5 || prev === 4) return prev - 1;
      if (levelTracker === 3) setTransition("highToLow");
      return 0;
    });
  }

  const handleClick = (item) => {
    const letterOrWord = levelTracker < 3 ? item.slice(0, 1) : item;
    const correct = letterOrWord === target;

    setClickedLetter(letterOrWord);
    setMessage(correct ? "Correct!" : "Incorrect!");
    setShowContinue(true);

    if (correct) levelUp();
    else levelDown();
  };

  const handleContinue = () => {
    const newImages = get_images(levelTracker);
    const newTarget = get_target(newImages, levelTracker);
    setImages(newImages);
    setTarget(newTarget);
    setMessage("Click " + newTarget);
    setClickedLetter(null);
    setShowContinue(false);
    setTransition(false);
  };

  return (
    <div className="app-container">
      {!showContinue && <h2 className="query-text">{message}</h2>}

      {showContinue && (
        <React.Fragment>
          <div className="query-text">Click {target}</div>
          <div
            className={`result-text ${
              message === "Correct!" ? "correct" : "incorrect"
            }`}
          >
            {message}
          </div>
        </React.Fragment>
      )}

      <div className="images-container">
        {images.map((item, i) => {
          const letterOrWord = levelTracker < 3 ? item.slice(0, 1) : item;
          let borderClass = "";
          if (showContinue) {
            if (letterOrWord === target) borderClass = "correct-border";
            else if (letterOrWord === clickedLetter)
              borderClass = "incorrect-border";
          }

          if ((levelTracker < 3 && transition !== "highToLow") || transition === "lowToHigh") {
            return (
              <img
                key={i}
                src={`/public/images/${item}`}
                alt={item}
                onClick={!showContinue ? () => handleClick(item) : undefined}
                className={`image ${borderClass} ${
                  showContinue ? "disabled" : ""
                }`}
              />
            );
          } else {
            return (
              <div
                key={i}
                onClick={!showContinue ? () => handleClick(item) : undefined}
                className={`word-box ${borderClass} ${
                  showContinue ? "disabled" : ""
                }`}
              >
                {item}
              </div>
            );
          }
        })}
      </div>

      {showContinue && (
        <button onClick={handleContinue} className="continue-btn">
          Continue
        </button>
      )}
    </div>
  );
}
