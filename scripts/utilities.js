let dialogStates =
{
  "moreOptions": false,
  "createList": false,
  "addTask": false,
  "viewLists": false
}


const CHART_COLORS = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

Number.prototype.clamp = function (min, max) {
  return Math.min(Math.max(this, min), max);
};


function util_get_transparent_color(rgb, alpha) {
  if (alpha == undefined)
    alpha = 0.5
  alpha = alpha.clamp(0, 1)
  return rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
}

let COLORS = {
  RED: "#ff6384",
  ORANGE: "#fea03e",
  YELLOW: "#eab308",
  GREEN: "#4ade80",
  BLUE: "#3b82f6",
  AMBER: "#f59e0b",
  LIME: "#84cc16",
  EMERALD: "#10b981",
  TEAL: "#14b8a6",
  CYAN: "#06b6d4",
  SKY: "#0ea5e9",
  INGIGO: "#6366f1",
  VIOLET: "#8b5cf6",
  PURPLE: "#a855f7",
  PINK: "#ec4899",
  ROSE: "#f43f5e",
  ALL: ["#ff6384", "#fea03e", "#fea03e", "#4ade80", "#fea03e", "#f59e0b", "#84cc16", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"]
}


//date argument in milliseconds
function timeSince(date) {
  if (!date || isNaN(date)) return "Invalid date";

  const secondsElapsed = Math.floor((Date.now() - date) / 1000);
  if (secondsElapsed < 0) return "Future date";

  const intervals = [
      { label: "year", seconds: 31536000 }, // 365 * 24 * 60 * 60
      { label: "month", seconds: 2592000 }, // 30 * 24 * 60 * 60
      { label: "day", seconds: 86400 }, // 24 * 60 * 60
      { label: "hour", seconds: 3600 }, // 60 * 60
      { label: "minute", seconds: 60 }
  ];

  if (secondsElapsed < 60) return "just now";

  for (const { label, seconds } of intervals) {
      const count = Math.floor(secondsElapsed / seconds);
      if (count >= 1) {
          return `${count} ${label}${count > 1 ? "s" : ""} ago`;
      }
  }
}



timeToGo = (date) => {
  if (date == Task.NOT_SCHEDULED)
    return "Normal Tasks";

  let minute = 60;
  let hour = minute * 60;
  let day = hour * 24;
  let month = day * 30;
  let year = day * 365;
  let suffix = ' to go ';
  let elapsed = Math.floor((date - Date.now()) / 1000);

  if (elapsed < 0) {
    return "Past tasks"
  }
  if (elapsed < minute && elapsed > 0) {
    return 'in few moments';
  }

  // get an array in the form of [number, string]
  let a = elapsed < hour && [Math.floor(elapsed / minute), 'minute'] ||
    elapsed < day && [Math.floor(elapsed / hour), 'hour'] ||
    elapsed < month && [Math.floor(elapsed / day), 'day'] ||
    elapsed < year && [Math.floor(elapsed / month), 'month'] ||
    [Math.floor(elapsed / year), 'year'];

  // pluralise and append suffix
  return a[0] + ' ' + a[1] + (a[0] === 1 ? '' : 's') + suffix;
}


groupBy = (list, keyGetter) => {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}



const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

getRandomInt = (min, max) => {
  return Math.round((Math.random() * (max - min)) + min);
}

getRandomPlaceHolderForNewTask = () => {
  let randomPlaceHolders = [
    "Remind me to call...",
    "Type new task here",
    "Don't forget to get groceries",
    "Remind to drink water at 4 pm",
    "Remind to wish birthday to my best friend in evening",
    "Need to complete project by thursday"
  ];
  return randomPlaceHolders.getRandomItem();
}



parseBool = (str) => {
  return str == "true";
}




function sortList(listArray) {
  let bucket = [];

  listArray.forEach(function (list) {
    let firstLetter = list.title.substr(0, 1).toLocaleUpperCase();
    bucket.push(
      {
        "list": list,
        "key": firstLetter
      });
  });

  bucket.sort(function (a, b) {
    return a.key.localeCompare(b.key)
  });
  return bucket;
}





function insertHtmlAtCursor(html) {
  var sel, range, node;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      range = window.getSelection().getRangeAt(0);
      node = range.createContextualFragment(html);
      range.insertNode(node);
    }
  }
}

function insertList(type) {
  document.querySelector("#newTaskContent").focus();
  var html = `<${type}><li>Type here</li></${type}>`;
  insertHtmlAtCursor(html)
}

function insertHeading() {
  document.querySelector("#newTaskContent").focus();
  insertHtmlAtCursor('<h1>Heading 1<h1/>')
}

function insertProgress() {
  document.querySelector("#newTaskContent").focus();
  insertHtmlAtCursor(`#50%`)
}






function insertTextAtCursor(textareaId, text) {
  var textarea = document.getElementById(textareaId);
  var startPos = textarea.selectionStart;
  var endPos = textarea.selectionEnd;
  var beforeText = textarea.value.substring(0, startPos);
  var afterText = textarea.value.substring(endPos, textarea.value.length);

  textarea.value = beforeText + text + afterText;
  textarea.selectionStart = textarea.selectionEnd = startPos + text.length;
  textarea.focus();


  let newValue = document.querySelector("#note_content").value
  console.log(newValue)
  angular.element(document.body).injector().get('$rootScope').$broadcast('update_note_content_from_outside', newValue);
}


//date and time formats
function formatDate(date) {
  var options = { day: '2-digit', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  return (hours < 10 ? '0' : '') + hours + (minutes < 10 ? '0' : '') + minutes + " hours";
}

function formatDay(date) {
  var options = { weekday: 'long' };
  return date.toLocaleDateString('en-US', options);
}

//yes means svg file is available inside icons folder
const iconMapping = {
  'finance': 'savings',//yes
  'money': 'attach_money',
  'shopping': 'shopping_cart',
  'work': 'work',
  'health': 'health_and_safety',
  'exercise': 'fitness_center',
  'food': 'restaurant',
  'travel': 'flight',
  'study': 'school',
  'music': 'music_note',//yes
  'movies': 'movie',
  'home': 'home',
  'family': 'family_restroom',
  'friends': 'group',
  'tasks': 'task',
  'events': 'event',
  'books': 'book',
  'technology': 'devices',
  'games': 'sports_esports',//yes
  'hobbies': 'palette',
  'pet': 'pets',
  'shopping': 'shopping_bag',
  'groceries': 'local_grocery_store',
  'car': 'directions_car',
  'bills': 'receipt_long',
  'insurance': 'policy',
  'loan': 'account_balance',
  'garden': 'local_florist',
  'repair': 'build',
  'news': 'article',
  'communication': 'chat',
  'meeting': 'meeting_room',
  'time': 'schedule',
  'reminder': 'notifications',
  'map': 'map',
  'notes': 'note',
  'wishlist': 'favorite',
  'food': 'fastfood',
  'nature': 'nature',
  'weather': 'wb_sunny',
  'science': 'science',
  'crafts': 'handyman',
  'shopping': 'shopping_basket',
  'security': 'security',
  'fitness': 'fitness_center',
  'kitchen': 'kitchen',
  'party': 'celebration',
  'gifts': 'card_giftcard',
  'todo': 'receipt_long',//yes
  'system': 'keyboard_command_key',//yes
};

function getIconForTitle(title) {
  for (const [keyword, icon] of Object.entries(iconMapping)) {
    if (title.toLowerCase().includes(keyword)) {
      return icon;
    }
  }
  return 'folder'; // Default icon
}

function getTranslateX(element) {
  const style = window.getComputedStyle(element);
  const matrix = new WebKitCSSMatrix(style.transform);
  return matrix.m41;
}

function split_text_into_tasks(text, delim) {
  let lines = text.trim().split(delim)
  let multiple_tasks = []
  lines.forEach((line, index) => {
    if (line.trim().length > 0) {
      multiple_tasks.push(line.trim())
    }
  })
  return multiple_tasks;
}

function is_valid_json(json_string) {
  try {
    JSON.parse(json_string);
    return true;  // JSON is valid
  } catch (e) {
    return false; // JSON is invalid
  }
}

// Function to calculate height based on number of lines
function calculate_height_based_on_lines(text, max_height) {
  const lineHeight = 20;
  const lines = text.split('\n').length;
  const h = lines * lineHeight;
  return Math.min(h, max_height);
}

let proverbs = [
  "An empty vessel can hold anything.",
  "An empty mind makes progress.",
  "Emptiness is the beginning of all things.",
  "An empty mind is a clear mind.",
  "The empty pot makes the loudest noise.",
  "The less you carry, the farther you go.",
  "Only when the cup is empty can it be filled.",
  "In the void, possibilities are endless.",
  "Silence is a source of great strength.",
  "Emptiness is the path to wisdom.",
  "A full cup cannot accept more water.",
  "True understanding comes from nothingness.",
]


function get_empty_proverbs() {
  try {
    const proverb = proverbs.getRandomItem()
    console.log(proverb)
    return proverb;
  } catch (err) {
    console.log(err)
  }
}

encrypt_data = (plain_text, key) => {
  let encrypted_text = CryptoJS.AES.encrypt(plain_text, key).toString();
  return encrypted_text;
}

decrypt_data = (encrypted_text, key) => {
  let bytes = CryptoJS.AES.decrypt(encrypted_text, key);
  let decrypted_text = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted_text;
}

function clamp(min, current, max) {
  return Math.min(Math.max(current, min), max);
}




function greet_user(username) {
  const currentHour = new Date().getHours(); // Get the current hour (0-23)
  let txt = "";
  if (currentHour >= 5 && currentHour < 12) {
    return `Morning, ${username}`
  } else if (currentHour >= 12 && currentHour < 17) {
    return `Afternoon, ${username}`
  } else if (currentHour >= 17 && currentHour < 21) {
    return `Evening, ${username}`
  } else {
    return `Night, ${username}`
  }
}




let touch = {
  x: {
    start: 0,
    end: 0,
    threshold: 50,
  },
  y: {
    start: 0,
    end: 0,
    threshold: 50,
  }
}


document.addEventListener("DOMContentLoaded", () => {
  // Detect when the user starts touching
  document.body.addEventListener('touchstart', (event) => {
    touch.x.start = event.touches[0].clientX; // Record the starting X position
    //console.log(touch.x.start)
  }, false);

  // Detect when the user ends touching
  document.body.addEventListener('touchend', (event) => {
    touch.x.end = event.changedTouches[0].clientX; // Record the ending X position
    handleSwipe();
  }, false);


})


// Determine swipe direction
function handleSwipe() {
  if (touch.x.end - touch.x.start > touch.x.threshold) { // Threshold to qualify as a 'right swipe'
    angular.element(document.body).injector().get('$rootScope').$broadcast(
      'broadcast_right_swipe',
      touch);


  }
}


function bool_to_on_off(state) {
  return state ? "on" : "off";
}


function get_download_file_name() {
  try {
    const date = new Date();
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).replace(/ /g, "-").toLowerCase();
    return `${formattedDate}-notebook-db.txt`;
  } catch (err) {
    console.log(err)
  }
}




function tell_angular_file_change_done(file_input) {
  try {
    var fileReader = new FileReader();
    fileReader.readAsText(file_input.files[0]);
    fileReader.onload = function () {
      angular.element(document.body).injector().get('$rootScope').$broadcast('file_onchange', fileReader.result);
    }
  } catch (err) {
    console.log(err)
  }
}

function import_file_event_change(file_input) {
  try {
    file_input.classList.add("green")
    //broadcast msg to angularjs
    tell_angular_file_change_done(file_input)

  } catch (err) {
    console.log(err)
  }
}