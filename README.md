# <img src="https://github.com/shreyagarg31/Automated-MLpipeline/blob/master/nodejs-express-sequelize-postgresql/nereis-ml-logo.png" width="300px" margin-left="-5px">

Nereis-ML is a web REST-API for training, optimizing and deploying machine learning models. It can be used to easily publish novel ML models for further use in open source.
## Key Features
- It supports __multiple ML frameworks__, like tensorflow, keras, pytorch and others integrated through [Optuna](https://github.com/optuna/optuna).
- Provides __Cloud Storage and Deployement__, with Docker to upload multiple datasets and network files
- Can perform efficient __Hyperparameter Optimization__ using software framework Optuna.
- Customers can test published models from inventory

## Installation

## Getting started

For new users, create an account otherwise signin using your credentials.Your credentials will be used to acquire an authentication token which will expire in 7 days after logging in. <br />
Datasets and Network files can be stored and managed in independent interfaces assigned respectively.<br />
__Code format to be followed for hyperparameter optimization__ <br />
It’s possible to choose the search space out of 5 distributions:
- uniform — float values
- log-uniform — float values
- discrete uniform — float values with intervals
- integer — integer values
- categorical — categorical values from a list

##### Objective function
Users need to create an objective function for the purpose of hyperparameter optimization. Use trial object as function parameter. To save models or weights, please use features of the machine learning library you used. 
##### For all the hyperparameters to be optimized make sure to make them class/function parameters and listed as elements of trial object in objective function. Depending on the return value of objective function choose direction of optimization as 'maximize' or 'minimize', eg- for error choose 'minimize'.
##### Name the file that contains objective function as "user_train.py"

```python
import tensorflow as tf
import optuna
fashion_mnist = tf.keras.datasets.fashion_mnist

(x_train, y_train), (x_test, y_test) = fashion_mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

def train_test_model(num_units: int, dropout_rate: float, optimizer: str) -> float:
    model = tf.keras.models.Sequential(
        [
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(num_units, activation=tf.nn.relu),
            tf.keras.layers.Dropout(dropout_rate),
            tf.keras.layers.Dense(10, activation=tf.nn.softmax),
        ]
    )
    model.compile(
        optimizer=optimizer, loss="sparse_categorical_crossentropy", metrics=["accuracy"]
    )

    model.fit(x_train, y_train, epochs=1)  # Run with 1 epoch to speed things up for demo purposes
    _, accuracy = model.evaluate(x_test, y_test)
    return accuracy

def objective(trial: optuna.trial.Trial) -> float:
    num_units = trial.suggest_int("NUM_UNITS", 16, 32)
    dropout_rate = trial.suggest_uniform("DROPOUT_RATE", 0.1, 0.2)
    optimizer = trial.suggest_categorical("OPTIMIZER", ["sgd", "adam"])

    accuracy = train_test_model(num_units, dropout_rate, optimizer)  
    return accuracy
```

