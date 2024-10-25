const COMPONENT={
  TYPE:
    {
      TABLE:"table",
      CHART:"chart",
      TEXT:"text",
    }
}
//Task class to handle tasks
class Task {
  constructor(note_content) {
    this.title = note_content.trim();
    this.dateCreated = Date.now();
    this.isTaskCompleted = false;
    this.taskIcon = "radio_button_unchecked";
    this.is_component = false;
    this.component_type = COMPONENT.TYPE.TEXT;
  }
  set_is_component()
  {
    this.is_component = this.title.trim().startsWith("@")
  }

  set_component_type()
  {
    if(this.is_component)
    {
      let line = this.title.trim().split("\n")[0]
      line = line.trim().split("@")[1].trim()
      this.component_type = line
    }else
      this.component_type = COMPONENT.TYPE.TEXT
  }

}