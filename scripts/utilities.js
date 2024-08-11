
let dialogStates =
{
  "moreOptions": false,
  "createList": false,
  "addTask": false,
  "viewLists": false
}


//@date: milliseconds
timeSince = (date) => {
  let minute = 60;
  let hour = minute * 60;
  let day = hour * 24;
  let month = day * 30;
  let year = day * 365;

  let suffix = ' ago';

  let elapsed = Math.floor((Date.now() - date) / 1000);

  if (elapsed < minute) {
    return 'just now';
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


function groupBy(list, keyGetter) {
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



Array.prototype.getRandomItem = function () {

  return this[getRandomInt(0, this.length - 1)];
}

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


showToast = (msg) => {

  document.querySelector(".toast").innerHTML = msg.trim();
  $(".toast").css("z-index", 1000);
  let durationToShow = 500;
  let durationToStay = 1500;
  let durationToHide = 1500;
  $(".toast").animate(
    {
      //first show toast
      opacity: 1
    }, durationToShow, "swing",
    function () {
      //do something when toast is shown
      $(".toast").animate(
        {
          opacity: 1
        }, durationToStay, "swing",
        function () {
          //do something when toast have stayed
          $(".toast").animate(
            {
              opacity: 0
            }, durationToHide, "swing",
            function () {
              //do something when opcaity is 0
              $(".toast").css("z-index", -99);
            }
          );
        });
    }
  );
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





function insertHtmlAtCursor(html)
{
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

function insertList(type)
{
  document.querySelector("#newTaskContent").focus();
  var html=`<${type}><li>Type here</li></${type}>`;
  insertHtmlAtCursor(html)
}

function insertHeading()
{
  document.querySelector("#newTaskContent").focus();
  insertHtmlAtCursor('<h1>Heading 1<h1/>')
}

function insertProgress()
{
  document.querySelector("#newTaskContent").focus();
  insertHtmlAtCursor(`#50%`)
}


function getRandomColor()
{
  let colors=
  [
    "#8bc34a",
    "#E91E63",
    "#CDDC39",
    "#00BCD4",
    "#009688"
  ]

  return colors[getRandomInt(0,colors.length-1)]

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


const iconMapping = {
  'finance': 'savings',
  'money': 'attach_money',
  'shopping': 'shopping_cart',
  'work': 'work',
  'health': 'health_and_safety',
  'exercise': 'fitness_center',
  'food': 'restaurant',
  'travel': 'flight',
  'study': 'school',
  'music': 'music_note',
  'movies': 'movie',
  'home': 'home',
  'family': 'family_restroom',
  'friends': 'group',
  'tasks': 'task',
  'events': 'event',
  'books': 'book',
  'technology': 'devices',
  'games': 'sports_esports',
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
  'todo': 'receipt_long',
  'system':'keyboard_command_key',
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

function sendNotification() {
  var options = {
      body: 'This is a notification.',
      icon: '/logo.png' // Optional: Add your icon here
  };
  var notification = new Notification('Hello!', options);

  // Optional: Add a click event to the notification
  notification.onclick = function() {
      window.open('https://yourwebsite.com'); // Open a URL on notification click
  };
}


function split_text_into_tasks(text,delim)
{
  let lines = text.trim().split(delim)
  let multiple_tasks = []
  lines.forEach((line,index)=>
  {
    if(line.trim().length>0)
    {
      multiple_tasks.push(line.trim())
    }
  })
  return multiple_tasks;
}



