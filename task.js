'use strict';

const middy = require('middy')
const { cors } = require('middy/middlewares')

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

//Method create
const create = (event, context, callback) => {
  var data = null;
  if (event.headers['Content-Type'] == 'application/json') {
    data = JSON.parse(event.body);
  } else {
    //Return error
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid Content-Type'
      })
    });
  }
  const params = {
    TableName: 'todo-list-task-table',
    Item: {
      userId: data.userId,
      taskId: data.taskId,
      taskLabel: data.taskLabel,
      dueDate: data.dueDate,
      completed: false,
      completedDate: null,
      tags: data.tags
    },
    ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(taskId)',
  };
  dynamo.put(params, (err, data) => {
    if(err != null && err.code == 'ConditionalCheckFailedException'){
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Task already exsists!'
        })
      });
    }
    else if (err) {
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Failed while creating task!',
          err: err,
          event: event
        })
      });
    } else {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Successfully created task!'
        })
      });
    }
  });
};

//Method update
const update = (event, context, callback) => {
  var data = null;
  if (event.headers['Content-Type'] == 'application/json') {
    data = JSON.parse(event.body);
  } else {
    //Return error
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid Content-Type'
      })
    });
  }
  const params = {
    TableName: 'todo-list-task-table',
    Item: {
      userId: data.userId,
      taskId: data.taskId,
      taskLabel: data.taskLabel,
      dueDate: data.dueDate,
      completed: data.completed,
      completedDate: data.completedDate,
      tags: data.tags
    },
    ConditionExpression: 'attribute_exists(userId) AND attribute_exists(taskId)',
  };
  dynamo.put(params, (err, data) => {
    if(err != null && err.code == 'ConditionalCheckFailedException'){
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Task dosen\'t exsists, create it first!'
        })
      });
    }
    else if (err) {
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Failed while updating task!',
          err: err,
          event: event
        })
      });
    } else {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Successfully updated task!'
        })
      });
    }
  });
};

//Method list
//Get only tasks that's not completed
const list = (event, context, callback) => {
  const params = {
    TableName: 'todo-list-task-table',
    KeyConditionExpression: 'userId = :userid',
    FilterExpression: '#c = :false',
    ExpressionAttributeNames: {
      '#c': 'completed'
    },
    ExpressionAttributeValues: {
      ':userid': event.queryStringParameters['userId'],
      ':false': false
    },
    ProjectionExpression: [
      'taskId',
      'taskLabel',
      'dueDate',
      'completed',
      'completedDate',
      'tags'
    ]
  };
  dynamo.query(params, (err, data) => {
    if (err) {
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Failed while listing task!',
          err: err
        })
      });
    } else {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Successfully listed task!',
          data: data.Items
        })
      });
    }
  });
};

//Export
module.exports = {
  create: middy(create).use(cors()),
  update: middy(update).use(cors()),
  list: middy(list).use(cors())
};
