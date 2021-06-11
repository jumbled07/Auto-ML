import tensorflow as tf
import pickle
import optuna
from keras.utils import to_categorical
from keras.datasets import mnist
from sklearn import svm, datasets
import sklearn.model_selection as model_selection
from sklearn.metrics import accuracy_score
import numpy as np
# from optuna.integration.tensorboard import TensorBoardCallback

dataset = datasets.load_iris()
pathDir=None
X = dataset.data[:, :2]
y = dataset.target
X_train, X_test, y_train, y_test = model_selection.train_test_split(X, y, train_size=0.80, test_size=0.20, random_state=101)

def dataloader(filename):
    dataset = datasets.load_iris()

    X = dataset.data[:, :2]
    y = dataset.target
    X_train, X_test, y_train, y_test = model_selection.train_test_split(X, y, train_size=0.80, test_size=0.20, random_state=101)
    return X_test, y_test

def bestmodel(study):
    #path= str(study.best_trial.number)
    #modelname= path+ ".h5"
    #best_model = tf.keras.models.load_model(modelname)
    with open("{}.pickle".format(study.best_trial.number), "rb") as fin:
        best_model=pickle.load(fin)
    return best_model

def getPath(path):
    pathDir=path

def train_test_model(C: float, gamma: float) -> float:

    model = svm.SVC(kernel='rbf', gamma=gamma, C=C)

    model.fit(X_train, y_train)  # Run with 1 epoch to speed things up for demo purposes
    accuracy = accuracy_score(y_test, model.predict(X_test))
    return accuracy, model


def objective(trial: optuna.trial.Trial) -> float:
    C = trial.suggest_int("C", 1.0, 100.0)
    gamma = trial.suggest_int("gamma", 1.0, 100.0)
    accuracy, model = train_test_model(C, gamma)  # type: ignore
    pathDir+=trial.number
    with open("{}.pickle".format(pathDir), "wb") as fout:
        pickle.dump(model, fout)
    #path= str(trial.number)
    #modelname= path+ ".h5"
    #model.save(modelname)
    return accuracy


# tensorboard_callback = TensorBoardCallback("logs/", metric_name="accuracy")

# study = optuna.create_study(direction="maximize")
# study.optimize(objective, n_trials=10, timeout=600, callbacks=[tensorboard_callback])