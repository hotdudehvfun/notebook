const COMPONENT = {
  TYPE: {
    TABLE: "table",
    CHART: "chart",
    TRANSACTIONS: "transactions",
    TEXT: "text",
  }
};

class Task {
  constructor(note_content) {
    try {
      // data
      this.title = (note_content || "").trim();
      this.dateCreated = Date.now();
      this.isTaskCompleted = false;
      this.taskIcon = "radio_button_unchecked";
      this.is_component = false;
      this.component_type = COMPONENT.TYPE.TEXT;

      //methods
      this.set_is_component();
      this.set_component_type();
    } catch (e) {
      console.error("Task initialization failed:", e);
    }
  }

  set_is_component() {
    this.is_component = this.title.startsWith("@");
  }

  set_component_type() {
    if (!this.is_component) {
      this.component_type = COMPONENT.TYPE.TEXT;
      return;
    }
    try {
      const firstLine = this.title.split("\n")[0].trim();
      const typeKey = firstLine.slice(1).split(" ")[0].toLowerCase();

      const validTypes = Object.values(COMPONENT.TYPE);
      this.component_type = validTypes.includes(typeKey) ? typeKey : COMPONENT.TYPE.TEXT;
    } catch (e) {
      console.error("Component type detection failed:", e);
      this.component_type = COMPONENT.TYPE.TEXT;
    }
  }
}
