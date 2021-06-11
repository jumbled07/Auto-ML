import tensorflow as tf
import sys
import os
import pickle
import pandas as pd
from sklearn import svm, datasets
import sklearn.model_selection as model_selection
import numpy as np

best_model = sys.argv[1]
folder= sys.argv[2]
loaded_model = pickle.load(open(best_model, 'rb'))# open a file, where you stored the pickled data
print(folder)

name = folder+ "/result.txt"
f= open(name,"w+")
dataset = datasets.load_iris()

X = dataset.data[:, :2]
y = dataset.target
X_train, X_test, y_train, y_test = model_selection.train_test_split(X, y, train_size=0.80, test_size=0.20, random_state=101)

for img in os.listdir(folder):
	if img.endswith(".txt"):
		continue
	print(img)
	path = folder +"/"+img
	data = pd.read_csv(path)
	pred = loaded_model.predict(X_test)
	print(pred)
	result = str(pred.tolist())
	f.write(result)
	# for row in pred:
	# 	np.savetxt(f, row)
print("closed")
f.close()
sys.exit(0)