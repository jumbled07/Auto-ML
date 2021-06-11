import optuna 
import joblib as joblib
import scikitplot as skplt
import numpy as np
import matplotlib as matplotlib
from matplotlib import pyplot as f
from sklearn.metrics import roc_curve, plot_roc_curve,confusion_matrix,plot_confusion_matrix,plot_precision_recall_curve
from sklearn.model_selection import cross_val_predict
import sys


def testing(filename, testfile):
	study = joblib.load(filename + '.pkl')
	best_model = user.bestmodel(study)
	x_true, y_true = user.dataloader(testfile)
	print(y_true)
	print(x_true.shape)
	y_probas = best_model.predict(x_true)
	
	optuna.visualization.matplotlib.plot_edf(study)
	f.savefig(filename + " 1.png", bbox_inches='tight', dpi=600)
	optuna.visualization.matplotlib.plot_intermediate_values(study)
	f.savefig(filename + " 2.png", bbox_inches='tight', dpi=600)
	optuna.visualization.matplotlib.plot_optimization_history(study)
	f.savefig(filename + " 3.png", bbox_inches='tight', dpi=600)
	optuna.visualization.matplotlib.plot_parallel_coordinate(study)
	f.savefig(filename + " 4.png", bbox_inches='tight', dpi=600)
	return  y_probas, y_true, best_model, x_true

def plot_roc_curve(fpr, tpr, label=None):
    f.figure(figsize=(12,8))
    f.title('ROC curve')
    f.plot(fpr, tpr, linewidth=2, label=label)
    f.plot([0,1],[0,1],"k--")
    f.xlim([0,1])
    f.ylim([0,1])
    f.xlabel('False positive rate')
    f.ylabel('True positive rate')

def roc(filename, best_model, X_test, y_test, y_probas):
	# skplt.metrics.plot_roc_curve(y_true_5, y_probas, title="ROC curve")
	print(X_test.shape)
	print(X_test)
	print(y_test.shape)
	fpr = dict()
	tpr = dict()
	roc_auc = dict()
	for i in range(3):
	    fpr[i], tpr[i], _ = roc_curve(y_test[:, i], y_probas[:, i])
	    roc_auc[i] = auc(fpr[i], tpr[i])
	f.plot(fpr[2], tpr[2], label='ROC curve (area = %0.2f)' % roc_auc[2])
	# plot_roc_curve(best_model, X_test, y_test)  
	# plot_roc_curve(best_model, x_true, y_true)
	# fpr, tpr, thresholds = skplt.metrics.roc_curve(y_test, y_probas, pos_label=2)
	f.savefig(filename + "_roc.png", bbox_inches='tight', dpi=600)

def precision(filename, best_model, x_true, y_true):
	plot_precision_recall_curve(best_model, x_true, y_true,
                       title="Digits Precision-Recall Curve", figsize=(12,6));
	f.savefig(filename + "_precision.png", bbox_inches='tight', dpi=600)

def confusion(filename, y_probas, y_true, best_model, x_true):
	# fig = f.figure(fig, size=(15,6))
	# ax2 = f.add_subplot(122)
	print(y_true)
	print(y_probas)
	# cn = confusion_matrix(y_true, y_probas);
	# print("cn")
	# print(cn)
	plot_confusion_matrix(best_model, x_true, y_true, cmap=f.cm.Blues)
	f.savefig(filename + "_confusion.png", bbox_inches='tight', dpi=600)

if __name__ == "__main__":
	name = sys.argv[1]
	user = __import__(name, globals(), locals(), ['dataloader', 'bestmodel'])
	testfile = sys.argv[2]
	filename = sys.argv[3]
	y_probas, y_true, best_model, x_true =testing(filename, testfile)
	# curve =sys.argv[4]
	# if curve=='1':
	# 	roc(filename, best_model, x_true, y_true, y_probas)
	# curve =sys.argv[5]
	# if curve=='1':
	# 	confusion(filename, y_probas, y_true, best_model, x_true)
	curve =sys.argv[6]
	if curve=='1':
		precision(filename, best_model, x_true, y_true)
	sys.exit(0)
