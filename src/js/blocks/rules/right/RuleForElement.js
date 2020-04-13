import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import { inject, observer } from "mobx-react";
import { observable, action } from 'mobx';
import { headerStyle, internalDivStyle } from "../../BlockStyles";
import Button from '../../../components/Button/Button';
import Link from '../../../components/Link/Link';
import Input from '../../../components/Input/Input';
import { add, close } from '../../../../icons/index';

const styles = {
	headerStyle,
	smallBtn: {
		width: '24px',
		height: '24px',
		padding: 0,
	},
	containerStyle: {
		display: 'flex',
		...internalDivStyle
	},
	textInput: {
		margin: '5px'
	},
	headerContainer: {
		borderBottom: '2px solid #e1e4e8',
		padding: '0 10px 10px 10px',
		margin: '0 -10px',
	},
	navContainer: {
		margin: '0 -10px',
	},
	fieldsContainer: {
		marginTop: '10px'
	},
	fields: {
		margin: '5px 0'
	},
	field: {
		display: 'inline-block',
		width: '100px'
	},
	deleteRule: {
		width: '16px',
		height: '16px',
		marginLeft: '5px'
	},
	ruleLink: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer'
	}
};

@inject('mainModel')
@observer
class RuleForElement extends React.Component {
	@observable isEditable = false;

	handleEditRuleName = () => {
		this.isEditable = !this.isEditable;
	};

	handleSwitchTab = (index) => {
		this.props.mainModel.ruleBlockModel.handleSwitchRule(index);
	};

	getCurrentRuleFields = (rules, index) => {
		if(rules && rules.length) {
			return Object.keys(rules[index]);
		}
		return [];
	};

	handleDeleteRule = (e, index) => {
		e.stopPropagation();
		this.props.mainModel.ruleBlockModel.handleDeleteRuleItem(index);
	};

	handleAddRule = () => {
		this.props.mainModel.ruleBlockModel.handleAddRuleItem();
	};

	handleEditRule = (value, field) => {
		this.props.mainModel.ruleBlockModel.handleEditRuleName(value, field);
	};

	render () {
		const { classes, mainModel } = this.props;
		const title = mainModel.ruleBlockModel.currentRuleName;
		const ruleSet = mainModel.ruleBlockModel.currentRuleSet;
		const rules = mainModel.ruleBlockModel.rules[ruleSet][title] || [];
		const itemIndex = mainModel.ruleBlockModel.currentRuleItem;
		const ruleFields = this.getCurrentRuleFields(rules, itemIndex);

		return (
			<div>
				<div className={classes.headerContainer}>
					<span className={classes.headerStyle}>{ title }</span>
				</div>
				<nav className={`UnderlineNav ${classes.navContainer}`}>
					<div className="UnderlineNav-body">
						{
							rules.map((rule, index) => {
								const cl = index === itemIndex ? ` selected` : '';
								return (
									<a role="tab"
									   key={`Rule ${index + 1}`}
									   className={`UnderlineNav-item ${classes.ruleLink} ${cl}`}
									   onClick={() => {this.handleSwitchTab(index)}}
									>
										{`Rule ${index + 1}`}
										<img src={close} className={classes.deleteRule} onClick={(e) => {this.handleDeleteRule(e, index)}} />
									</a>
								)
							})
						}
						<a role="tab"
						   className='UnderlineNav-item'
						>
							<img src={add} className={classes.deleteRule} onClick={this.handleAddRule} />
						</a>
					</div>
				</nav>
				<div className={classes.fieldsContainer}>
					{ruleFields.map(field => {
						if(field !== 'id') {
							return (
								<div key={field + title} className={classes.fields}>
									<span className={classes.field}>{field} </span>
									<Input
										value={rules[itemIndex][field]}
										onchange={(e) => {this.handleEditRule(e, field)}}
									/>
								</div>
							)
						}
					})}
				</div>
			</div>
		)
	}
}

RuleForElement.propTypes = {};

const RuleForElementWrapper = injectSheet(styles)(RuleForElement);

export default RuleForElementWrapper;
