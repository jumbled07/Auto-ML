import tensorflow as tf
import pickle
import optuna
from keras.utils import to_categorical
from keras.datasets import mnist

# from optuna.integration.tensorboard import TensorBoardCallback


fashion_mnist = tf.keras.datasets.fashion_mnist

# (x_train, y_train), (x_test, y_test) = fashion_mnist.load_data()
# x_train, x_test = x_train / 255.0, x_test / 255.0
(trainX, trainY), (testX, testY) = mnist.load_data()

def dataloader(filename):
    (trainX, trainY), (testX, testY) = mnist.load_data()
    trainX = trainX.reshape((trainX.shape[0], 28, 28, 1))
    testX = testX.reshape((testX.shape[0], 28, 28, 1))
    # one hot encode target values
    trainY = to_categorical(trainY)
    testY = to_categorical(testY)
    return testX, testY

def bestmodel(study):
    path= str(study.best_trial.number)
    modelname= path+ ".h5"
    best_model = tf.keras.models.load_model(modelname)
    return best_model


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

    model.fit(trainX, trainY, epochs=1)  # Run with 1 epoch to speed things up for demo purposes
    _, accuracy = model.evaluate(testX, testY)
    return accuracy, model


def objective(trial: optuna.trial.Trial) -> float:
    num_units = trial.suggest_int("NUM_UNITS", 16, 32)
    dropout_rate = trial.suggest_uniform("DROPOUT_RATE", 0.1, 0.2)
    optimizer = trial.suggest_categorical("OPTIMIZER", ["sgd", "adam"])
    accuracy, model = train_test_model(num_units, dropout_rate, optimizer)  # type: ignore
    path= str(trial.number)
    modelname= path+ ".h5"
    model.save(modelname)
    return accuracy


# tensorboard_callback = TensorBoardCallback("logs/", metric_name="accuracy")

# study = optuna.create_study(direction="maximize")
# study.optimize(objective, n_trials=10, timeout=600, callbacks=[tensorboard_callback])