# FlameDisk

FlameDisk is an Disk Storage implementation. The database works by storing its models across multiple files.
When a user queries only the files that are needed are loaded allowing the database to be quick
and only consume the memory that is needs.

## Installation

To install use

        npm install flamedisk


Once install you can require flamedisk by typing

      import {default as Storage} from "flamedisk"

This will give you access to the singleton Storage class.

using this class you can added new validation rules and create
new classes.



## Validation


### Creating rules
To added new validation you can use.

    import {default as Storage} from "flamedisk";

    let storage = new Storage({...});
    storage.validation.register("name",function(value){

    })


For validation if you need to pass in an argument to the validation at runtime you would register the validation like this.


    storage.validation.register("name",function(value,argument1,argument2){

    })



### Using Validation


When you are ready to use the validation on a class you can use it like this


    storage.Create({
        name:"ModelName",
        instance:{
          length:"number|min(4)|max(20)"
        }
    })


All created Models needs to have a name and instance

the name is the name of the class while the instance if the properties that are on the class.

Validations are stacked, so number|min|max will be validated and the return or the validation function is used in the next validation;



    storage.Create({
        name:"ModelName",
        instance:{
          length:"nullable|number|min(4)|max(20)"
        }
    })

All model instance properties are required in order to pass validation. This can be changed with the nullable validation filter.

Place this at the front of an validation string and if will allow null and undefined values.



    storage.Create({
        name:"ModelName",
        instance:{
          firstname:"string",
          lastname:"string",
          length:"number"
        },
        classMethods:{
          name:function(){
            return this.firstname+ " "+ this.lastname;
          }
        }
    })


Class Methods are used to add extra functionality to a class. This will allow different methods to be placed on the instance.



    storage.Create({
        name:"ModelName",
        instance:{
          firstname:"string",
          lastname:"string",
          length:"number"
        },
        classMethods:{
          name:function(){
            return this.firstname+ " "+ this.lastname;
          }
        },
        hooks:{
          beforeCreate:...
        }
    });


### LifeCycle hooks

Life cycle hooks are important because it allows you to perform extra operations while a class is being Created,Updated or Saved.

Hooks have the following structure.

    function(err,next){

    }

Use the next function when you have completed everything you need to for your Lifecycle hook.


### Instance

When a class is created the class constructor is returned.
it will also be saved under Storage[name]


    storage.Create({
        name="classname"
        ...
    })


You can access the class as

    storage.classname

There are multiple ways to create a new Instance


    ClassName = storage.Create({
        name="classname"
        ...
    })

    new Storage.classname({...})
    new ClassName({...})
