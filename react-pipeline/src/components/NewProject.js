import React, { Component } from "react";
import { render } from "react-dom";
import Button from '@material-ui/core/Button';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import Icon from '@material-ui/core/Icon';
import SaveIcon from '@material-ui/icons/Save';


class Create extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			projectDetails = [] ,
			isLoading = false ,
			name: ''
		};

		this.create = this.create.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

/*	componentDidMount(){
		this.setState({...this.state, isFetching: true});
         fetch("https://fairestdb.p.rapidapi.com/", {
	       "method": "GET",
	       "headers": {
	         "x-rapidapi-host": "fairestdb.p.rapidapi.com",
	         "x-rapidapi-key": API_KEY
	       }
	     })
	     .then(response => response.json())
	     .then(data => {
	       this.setState({
	         projectDetails: data ,
	         isLoading : false ,
	       })
	     })
	     .catch(err => { 
	     	console.log(err);
	     	this.setState({...this.state, isLoading: false });
	}
	*/

	  create(e) {
    // add project name - POST
		e.preventDefault();
		// creates entity
		fetch("https://fairestdb.p.rapidapi.com/", {
		  "method": "POST",
		  "headers": {
		    "x-rapidapi-host": "fairestdb.p.rapidapi.com",
		    "x-rapidapi-key": API_KEY,
		    "content-type": "application/json",
		    "accept": "application/json"
		  }
		  "body": JSON.stringify({
		    name: this.state.name,
		  })
		})
		.then(response => response.json())
		.then(response => {
		  console.log(response);
		})
		.catch(err => {
		  console.log(err);
		});
  }

    handleChange(changeObject) {
    this.setState(changeObject)
  }

  render(){
  	return (
           <div className="container">
           <form className="d-flex flex-column">
                           <label htmlFor="name">
                  Project Name:
                  <input
                    name="name"
                    id="name"
                    type="text"
                    className="form-control"
                    value={this.state.name}
                    onChange={(e) => this.handleChange({ name: e.target.value })}
                    required
                    />
                </label>

                <Button 
                	variant="contained" 
                	color="secondary"
                	startIcon={<AddCircleIcon />}
                	onClick={(e) => this.create(e)}
                	>
                  Create
                </Button>
  	)
  }

}

export default Create;