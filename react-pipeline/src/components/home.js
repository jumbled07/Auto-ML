import React, { Component } from "react";
import { render } from "react-dom";
import Button from '@material-ui/core/Button';
import CreateIcon from '@material-ui/icons/Create';
import Icon from '@material-ui/core/Icon';
import SaveIcon from '@material-ui/icons/Save';
import NewProject from "./NewProject";

class Project extends Component {
	constructor() {
    super();
    this.state = {
      name: "React",
      showProject: false,
    };
    this.hideComponent = this.hideComponent.bind(this);
  }

  hideComponent(name) {
    console.log(name);
    switch (name) {
      case "showProject":
        this.setState({ showProject: !this.state.showProject });
        break;
      default:
        null;
    }
  }

  render() {
  	const {showProject} = this.state;
  	return (
  		<div>
        {showProject && <NewProject />}
        <hr />
        <div>
            <Button 
                	variant="contained" 
                	color="secondary"
                	startIcon={<CreateIcon />}
                	onClick={() => this.hideComponent("showProject")}
                	>
                  New Project
                </Button>
          </div>
      </div>
  		
  		);
  }
}

export default Project;