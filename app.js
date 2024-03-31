const express = require('express')
const app = express()
app.use(express.json())
module.exports = app

// const bcrypt = require('bcrypt')
// const jwt = require('jsonwebtoken')

const isValid = require('date-fns/isValid')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDBObjToResponseObj = todoObj => {
  return {
    id: todoObj.id,
    todo: todoObj.todo,
    priority: todoObj.priority,
    status: todoObj.status,
    category: todoObj.category,
    dueDate: todoObj.due_date,
  }
}

const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}
const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusAndPriority = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  )
}
const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  )
}
const hasCategory = requestQuery => {
  return requestQuery.category !== undefined
}
const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

//API 1
app.get('/todos/', async (request, response) => {
  const requestBody = request.query
  const {category, priority, status, search_q = ''} = requestBody

  let data = null
  let getTodosQuery = ''

  switch (true) {
    case hasStatus(request.query): //scenario1
      if (
        requestBody.status === 'TO DO' ||
        requestBody.status === 'IN PROGRESS' ||
        requestBody.status === 'DONE'
      ) {
        getTodosQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND status='${status}';`

        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDBObjToResponseObj(todo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasPriority(request.query): //scenario2
      if (
        requestBody.priority === 'HIGH' ||
        requestBody.priority === 'MEDIUM' ||
        requestBody.priority === 'LOW'
      ) {
        getTodosQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND priority='${priority}';`

        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDBObjToResponseObj(todo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatusAndPriority(request.query): //scenario3
      if (
        requestBody.status === 'TO DO' ||
        requestBody.status === 'IN PROGRESS' ||
        requestBody.status === 'DONE'
      ) {
        if (
          requestBody.priority === 'HIGH' ||
          requestBody.priority === 'MEDIUM' ||
          requestBody.priority === 'LOW'
        ) {
          getTodosQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND status='${status}'
        AND priority='${priority}';`

          data = await db.all(getTodosQuery)
          response.send(data.map(todo => convertDBObjToResponseObj(todo)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasCategoryAndStatus(request.query): //scenario5
      if (
        requestBody.category === 'WORK' ||
        requestBody.category === 'HOME' ||
        requestBody.category === 'LEARNING'
      ) {
        if (
          requestBody.status === 'TO DO' ||
          requestBody.status === 'IN PROGRESS' ||
          requestBody.status === 'DONE'
        ) {
          getTodosQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%'
          AND status='${status}'
          AND category='${category}';`

          data = await db.all(getTodosQuery)
          response.send(data.map(todo => convertDBObjToResponseObj(todo)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategory(request.query): //scenario6
      if (
        requestBody.category === 'WORK' ||
        requestBody.category === 'HOME' ||
        requestBody.category === 'LEARNING'
      ) {
        getTodosQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND category='${category}';`

        data = await db.all(getTodosQuery)
        response.send(data.map(todo => convertDBObjToResponseObj(todo)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case hasCategoryAndPriority(request.query): //scenario7
      if (
        requestBody.category === 'WORK' ||
        requestBody.category === 'HOME' ||
        requestBody.category === 'LEARNING'
      ) {
        if (
          requestBody.priority === 'HIGH' ||
          requestBody.priority === 'MEDIUM' ||
          requestBody.priority === 'LOW'
        ) {
          getTodosQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%'
          AND category='${category}'
          AND priority='${priority}';`

          data = await db.all(getTodosQuery)
          response.send(data.map(todo => convertDBObjToResponseObj(todo)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default: //scenario4
      getTodosQuery = `
      SELECT *
      FROM todo
      WHERE todo LIKE '%${search_q}%';`

      data = await db.all(getTodosQuery)
      response.send(data.map(todo => convertDBObjToResponseObj(todo)))
      break
  }
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `
  SELECT *
  FROM todo
  WHERE id=${todoId};`

  const getTodoDetails = await db.get(getTodoQuery)
  response.send(convertDBObjToResponseObj(getTodoDetails))
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    console.log(newDate)

    const getTodosQuery = `
    SELECT *
    FROM todo
    WHERE due_date='${newDate}';`

    const getTodos = await db.all(getTodosQuery)
    response.send(getTodos.map(todoObj => convertDBObjToResponseObj(todoObj)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          console.log(newDueDate)

          const addTodoQuery = `
          INSERT INTO
          todo (id,todo,priority,status,category,due_date)
          VALUES
          (
          '${id}',
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          '${newDueDate}'
          );`

          const addTodo = await db.run(addTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body

  const previousTodoQuery = `
  SELECT *
  FROM todo
  WHERE id=${todoId};`

  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body

  let updateTodoQuery

  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO Do' || status === 'IN PROGRESS' || status === 'Done') {
        updateTodoQuery = `
        UPDATE todo
        SET todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',
        due_date='${dueDate}'
        WHERE id=${todoId};`

        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `
        UPDATE todo
        SET todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',
        due_date='${dueDate}'
        WHERE id=${todoId};`

        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',
        due_date='${dueDate}'
        WHERE id=${todoId};`

      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
        UPDATE todo
        SET todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',
        due_date='${dueDate}'
        WHERE id=${todoId};`

        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodoQuery = `
        UPDATE todo
        SET todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',
        due_date='${newDueDate}'
        WHERE id=${todoId};`

        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
  DELETE
  FROM todo
  WHERE id=${todoId};`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
